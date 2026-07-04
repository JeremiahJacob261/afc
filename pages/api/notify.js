import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

function amountValue(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value, digits = 4) {
  return amountValue(value).toFixed(digits)
}

function amountText(value, digits = 4) {
  return `${formatAmount(value, digits)} USDT`
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

  return {
    id: `app-${item.id}`,
    appNotificationId: item.id,
    type: eventType,
    title: item.title,
    titleKey: `mobile.notifications.events.${eventType}.title`,
    message: item.body,
    messageKey: `mobile.notifications.events.${eventType}.message`,
    messageValues: data,
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
      message: `You received a rebate bonus of ${formatAmount(amount)} USDT from ${sourceUsername}`,
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
      message: `You received a deposit bonus of ${formatAmount(amount)} USDT from ${sourceUsername}`,
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
    message: `You received a bonus of ${formatAmount(amount)} USDT`,
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
    message: `You received a first deposit bonus of ${formatAmount(amount)} USDT`,
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
    message: `You won your bet of ${formatAmount(amount, 2)} USDT`,
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
  const method = item.method || 'USDT'
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
    message: `You received ${formatAmount(amount, 2)} USDT ${item.method || 'reward'} from admin`,
    messageKey: 'mobile.notifications.messages.adminReward',
    messageValues: { amount: amountText(amount, 2), method: item.method || 'reward' },
    amount,
    sourceUsername: 'admin',
    timestamp: timestampOf(item),
    category: 'admin',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username,newrefer')
    const notifications = []

    if (req.method === 'POST' && req.body?.action === 'mark-read') {
      let query = supabase
        .from('app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_username', profile.username)
        .is('read_at', null)

      if (Array.isArray(req.body.ids) && req.body.ids.length) {
        query = query.in('id', req.body.ids)
      }

      const { error } = await query
      if (error) throw error

      return res.status(200).json({ status: 'success' })
    }

    const { data: appRows, error: appError } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('recipient_username', profile.username)
      .order('created_at', { ascending: false })

    if (appError) throw appError

    const appSourceKeys = new Set()
    ;(appRows || []).forEach((item) => {
      notifications.push(appNotification(item))
      const key = notificationSourceKey(item.source_table, item.source_id)
      if (key) appSourceKeys.add(key)
    })

    if (profile.newrefer) {
      const { data: bonusRows, error: bonusError } = await supabase
        .from('activa')
        .select()
        .eq('code', profile.newrefer)
        .order('id', { ascending: false })

      if (bonusError) throw bonusError

      ;(bonusRows || []).forEach((item) => {
        notifications.push(bonusNotification(item, profile))
      })
    }

    const { data: broadcastRows, error: broadcastError } = await supabase
      .from('activa')
      .select()
      .eq('code', 'broadcast')
      .order('id', { ascending: false })

    if (broadcastError) throw broadcastError

    ;(broadcastRows || []).forEach((item) => {
      notifications.push(broadcastNotification(item))
    })

    const { data: betRows, error: betError } = await supabase
      .from('activa')
      .select()
      .match({ username: profile.username, code: 'bet' })
      .order('id', { ascending: false })

    if (betError) throw betError

    ;(betRows || []).forEach((item) => {
      notifications.push(betWinNotification(item))
    })

    const { data: firstDepositBonuses, error: firstDepositBonusError } = await supabase
      .from('activa')
      .select()
      .match({ username: profile.username, code: 'firstdepositbonus' })
      .order('id', { ascending: false })

    if (firstDepositBonusError) throw firstDepositBonusError

    ;(firstDepositBonuses || []).forEach((item) => {
      notifications.push(firstDepositBonusNotification(item))
    })

    const { data: transactionRows, error: transactionError } = await supabase
      .from('notification')
      .select()
      .eq('username', profile.username)
      .in('sent', ['success', 'failed'])
      .order('id', { ascending: false })

    if (transactionError) throw transactionError

    ;(transactionRows || []).forEach((item) => {
      const sourceKeys = [
        notificationSourceKey('notification', item.id),
        notificationSourceKey('notification', item.uid),
      ].filter(Boolean)
      const hasAppNotification = sourceKeys.some((key) => appSourceKeys.has(key))

      if (item.address !== 'admin' && !hasAppNotification) {
        notifications.push(transactionNotification(item))
      }
    })

    const { data: adminRewardRows, error: adminRewardError } = await supabase
      .from('notification')
      .select()
      .match({ username: profile.username, address: 'admin' })
      .order('id', { ascending: false })

    if (adminRewardError) throw adminRewardError

    ;(adminRewardRows || []).forEach((item) => {
      notifications.push(adminRewardNotification(item))
    })

    const sorted = sortNotifications(notifications)
    const unreadCount = (appRows || []).filter((item) => !item.read_at).length

    if (req.query?.summary === '1') {
      return res.status(200).json({ notifications: sorted, unreadCount })
    }

    return res.status(200).json(sorted)
  } catch (error) {
    return sendApiError(res, error)
  }
}
