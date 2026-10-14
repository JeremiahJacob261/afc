import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { applyCursor, cursorPage, decodeCursor, encodeCursor, pageSize } from '@/lib/pagination'

function amountValue(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value, digits = 4) {
  return amountValue(value).toFixed(digits)
}

function amountText(value, digits = 4) {
  return `${formatAmount(value, digits)} MMK`
}

function sourceLabel(item, profile) {
  if (item.username && item.username !== profile.username) return item.username
  return 'a downline'
}

function timestampOf(item) {
  return item.created_at || item.time || null
}

function sortNotifications(items) {
  return items.sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime()
    const bTime = new Date(b.timestamp || 0).getTime()
    return bTime - aTime
  })
}

function notificationSourceKey(sourceTable, sourceId) {
  if (!sourceTable || sourceId === undefined || sourceId === null) return ''
  return `${sourceTable}:${sourceId}`
}

function categoryForAppEvent(eventType) {
  if (eventType === 'wheel_reward') return 'bonus'
  if (String(eventType || '').startsWith('deposit_')) return 'deposit'
  if (String(eventType || '').startsWith('withdrawal_')) return 'withdrawal'
  if (eventType === 'bet_settled') return 'bet'
  if (eventType === 'company_match_posted') return 'match'
  if (eventType === 'team_member_joined') return 'team'
  if (eventType === 'test_push') return 'admin'
  return 'broadcast'
}

function appNotification(item) {
  const eventType = item.event_type || 'notification'
  const data = item.data || {}
  const messageValues = data.outcome && !data.outcomeKey
    ? { ...data, outcomeKey: `status.${data.outcome}` }
    : data

  return {
    id: `app-${item.id}`,
    appNotificationId: item.id,
    type: eventType,
    title: item.title,
    titleKey: `mobile.notifications.events.${eventType}.title`,
    message: item.body,
    messageKey: `mobile.notifications.events.${eventType}.message`,
    messageValues,
    amount: amountValue(data.amount || data.payout || data.stake || 0),
    sourceUsername: data.username || '',
    timestamp: item.created_at,
    readAt: item.read_at,
    category: categoryForAppEvent(eventType),
    sourceTable: item.source_table || '',
    sourceId: item.source_id || '',
  }
}

function bonusNotification(item, profile) {
  const amount = amountValue(item.amount)
  const timestamp = timestampOf(item)

  if (item.type === 'affbonus') {
    const sourceUsername = sourceLabel(item, profile)
    return {
      id: `activa-${item.id}`,
      type: 'affbonus',
      title: 'Rebate bonus',
      titleKey: 'mobile.notifications.titles.rebateBonus',
      message: `You received a rebate bonus of ${formatAmount(amount)} MMK from ${sourceUsername}`,
      messageKey: 'mobile.notifications.messages.rebateBonus',
      messageValues: { amount: amountText(amount), sourceUsername },
      amount,
      sourceUsername,
      timestamp,
      category: 'bonus',
    }
  }

  if (item.type === 'depbonus') {
    const sourceUsername = sourceLabel(item, profile)
    return {
      id: `activa-${item.id}`,
      type: 'depbonus',
      title: 'Referral deposit bonus',
      titleKey: 'mobile.notifications.titles.referralDepositBonus',
      message: `You received a deposit bonus of ${formatAmount(amount)} MMK from ${sourceUsername}`,
      messageKey: 'mobile.notifications.messages.referralDepositBonus',
      messageValues: { amount: amountText(amount), sourceUsername },
      amount,
      sourceUsername,
      timestamp,
      category: 'bonus',
    }
  }

  return {
    id: `activa-${item.id}`,
    type: item.type || 'bonus',
    title: 'Bonus',
    titleKey: 'mobile.notifications.titles.bonus',
    message: `You received a bonus of ${formatAmount(amount)} MMK`,
    messageKey: 'mobile.notifications.messages.bonus',
    messageValues: { amount: amountText(amount) },
    amount,
    sourceUsername: item.username || '',
    timestamp,
    category: 'bonus',
  }
}

function firstDepositBonusNotification(item) {
  const amount = amountValue(item.amount)
  return {
    id: `activa-${item.id}`,
    type: 'firstdepositbonus',
    title: 'First deposit bonus',
    titleKey: 'mobile.notifications.titles.firstDepositBonus',
    message: `You received a first deposit bonus of ${formatAmount(amount)} MMK`,
    messageKey: 'mobile.notifications.messages.firstDepositBonus',
    messageValues: { amount: amountText(amount) },
    amount,
    sourceUsername: '',
    timestamp: timestampOf(item),
    category: 'bonus',
  }
}

function betWinNotification(item) {
  const amount = amountValue(item.amount)
  return {
    id: `activa-${item.id}`,
    type: 'bet',
    title: 'Bet won',
    titleKey: 'mobile.notifications.titles.betWon',
    message: `You won your bet of ${formatAmount(amount, 3)} MMK`,
    messageKey: 'mobile.notifications.messages.betWon',
    messageValues: { amount: amountText(amount, 2) },
    amount,
    sourceUsername: '',
    timestamp: timestampOf(item),
    category: 'bet',
  }
}

function broadcastNotification(item) {
  return {
    id: `activa-${item.id}`,
    type: 'broadcast',
    title: 'Announcement',
    titleKey: 'mobile.notifications.titles.announcement',
    message: item.username || 'New announcement',
    amount: 0,
    sourceUsername: 'admin',
    timestamp: timestampOf(item),
    category: 'broadcast',
  }
}

function transactionNotification(item) {
  const amount = amountValue(item.amount)
  const type = item.type || 'transaction'
  const typeLabel = type === 'withdrawer' ? 'withdrawal' : type
  const status = item.sent || 'pending'
  const method = type === 'deposit' ? (item.method || 'USDT') : 'MMK'
  const typeKey = type === 'deposit' ? 'common.deposit' : 'common.withdraw'
  const statusKey = status === 'success' ? 'status.success' : status === 'failed' ? 'status.failed' : status === 'processing' ? 'status.processing' : 'status.pending'

  return {
    id: `notification-${item.id || item.uid}`,
    type,
    title: type === 'deposit' ? 'Deposit update' : 'Withdrawal update',
    titleKey: type === 'deposit' ? 'mobile.notifications.titles.depositUpdate' : 'mobile.notifications.titles.withdrawalUpdate',
    message: `Your ${typeLabel} of ${formatAmount(amount, 2)} ${method} is ${status}`,
    messageKey: 'mobile.notifications.messages.transactionUpdate',
    messageValues: {
      typeLabel,
      typeKey,
      amount: formatAmount(amount, 2),
      method,
      status,
      statusKey,
    },
    amount,
    sourceUsername: '',
    timestamp: timestampOf(item),
    category: type === 'deposit' ? 'deposit' : 'withdrawal',
  }
}

function adminRewardNotification(item) {
  const amount = amountValue(item.amount)
  return {
    id: `notification-admin-${item.id || item.uid}`,
    type: 'admin',
    title: 'Admin reward',
    titleKey: 'mobile.notifications.titles.adminReward',
    message: `You received ${formatAmount(amount, 3)} MMK ${item.method || 'reward'} from admin`,
    messageKey: 'mobile.notifications.messages.adminReward',
    messageValues: { amount: amountText(amount, 2), method: item.method || 'reward' },
    amount,
    sourceUsername: 'admin',
    timestamp: timestampOf(item),
    category: 'admin',
  }
}

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser(req)
    const supabase = getSupabaseAdmin()
    const notifications = []

    if (req.method === 'POST' && req.body?.action === 'mark-read') {
      const ids = req.body.ids
      if (ids != null && (!Array.isArray(ids) || ids.length > 100 || ids.some(id => !/^\d+$/.test(String(id))))) {
        return res.status(400).json({ status: 'error', message: 'Invalid notification ids' })
      }
      const { error } = await timedRpc(req, supabase, 'mark_customer_notifications_read', {
        p_userid: user.id, p_ids: ids?.length ? ids : null,
      })
      if (error) throw error
      return res.status(200).json({ status: 'success' })
    }

    res.setHeader('Cache-Control', 'private, no-store')
    const paged = req.query?.page === '1'
    const cursor = decodeCursor(req.query?.cursor)
    const limit = pageSize(req.query?.limit, 25, 50)
    const { data: records, error } = await timedRpc(req, supabase, 'read_notification_sources', {
      p_userid: user.id, p_limit: paged ? limit + 1 : 1000, p_cursor: cursor,
    })
    if (error) throw error
    const profile = records.profile
    const sources = ['app', 'bonus', 'broadcast', 'bet', 'firstDeposit', 'transaction', 'reward'].map(key => [key])
    const results = sources.map(([key]) => ({ data: records.sources[key] }))
    const next = {}
    const rows = results.map((result, index) => {
      if (result.error) throw result.error
      const page = paged ? cursorPage(result.data || [], limit) : { data: result.data || [] }
      next[sources[index][0]] = page.next
      return page.data
    })
    const [appRows, bonusRows, broadcastRows, betRows, firstDepositBonuses, transactionRows, adminRewardRows] = rows
    const appSourceKeys = new Set()
    appRows.forEach(item => {
      notifications.push(appNotification(item))
      const key = notificationSourceKey(item.source_table, item.source_id)
      if (key) appSourceKeys.add(key)
    })
    bonusRows.forEach(item => notifications.push(bonusNotification(item, profile)))
    broadcastRows.forEach(item => notifications.push(broadcastNotification(item)))
    betRows.forEach(item => notifications.push(betWinNotification(item)))
    firstDepositBonuses.forEach(item => notifications.push(firstDepositBonusNotification(item)))
    transactionRows.forEach(item => {
      const keys = [notificationSourceKey('notification', item.id), notificationSourceKey('notification', item.uid)].filter(Boolean)
      if (item.address !== 'admin' && !keys.some(key => appSourceKeys.has(key))) notifications.push(transactionNotification(item))
    })
    adminRewardRows.forEach(item => notifications.push(adminRewardNotification(item)))

    const sorted = sortNotifications(notifications)
    const unreadCount = records.unreadCount

    if (paged) return res.status(200).json({ notifications: sorted, unreadCount, nextCursor: Object.values(next).some(Boolean) ? encodeCursor(next) : null })

    if (req.query?.summary === '1') {
      return res.status(200).json({ notifications: sorted, unreadCount })
    }

    return res.status(200).json(sorted)
  } catch (error) {
    return sendApiError(res, error)
  }
})
