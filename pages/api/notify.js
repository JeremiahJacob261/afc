import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

function amountValue(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value, digits = 4) {
  return amountValue(value).toFixed(digits)
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

function bonusNotification(item, profile) {
  const amount = amountValue(item.amount)
  const timestamp = timestampOf(item)

  if (item.type === 'affbonus') {
    const sourceUsername = sourceLabel(item, profile)
    return {
      id: `activa-${item.id}`,
      type: 'affbonus',
      title: 'Rebate bonus',
      message: `You received a rebate bonus of ${formatAmount(amount)} USDT from ${sourceUsername}`,
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
      message: `You received a deposit bonus of ${formatAmount(amount)} USDT from ${sourceUsername}`,
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
    message: `You received a bonus of ${formatAmount(amount)} USDT`,
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
    message: `You received a first deposit bonus of ${formatAmount(amount)} USDT`,
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
    message: `You won your bet of ${formatAmount(amount, 2)} USDT`,
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

  return {
    id: `notification-${item.id || item.uid}`,
    type,
    title: type === 'deposit' ? 'Deposit update' : 'Withdrawal update',
    message: `Your ${typeLabel} of ${formatAmount(amount, 2)} ${method} is ${status}`,
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
    message: `You received ${formatAmount(amount, 2)} USDT ${item.method || 'reward'} from admin`,
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
      if (item.address !== 'admin') notifications.push(transactionNotification(item))
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

    return res.status(200).json(sortNotifications(notifications))
  } catch (error) {
    return sendApiError(res, error)
  }
}
