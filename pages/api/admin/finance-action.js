import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { callInternalRpc } from '@/lib/serverRpc'
import { requireAdmin } from '@/lib/adminAuth'
import {
  getPaymentMethod,
  getPaymentRate,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

async function getNotificationRate(supabase, notification) {
  const method = normalizePaymentCode(notification.method || 'usdt')
  const savedMethod = await getPaymentMethod(supabase, method)
  const fallback = method === 'usdt' ? 1 : 0
  const rate = getPaymentRate(savedMethod, fallback)

  if (!rate) {
    const error = new Error(`No saved rate found for ${method.toUpperCase()}`)
    error.statusCode = 400
    throw error
  }

  return { method, rate }
}

async function getUsdtAmount(supabase, notification) {
  const { method, rate } = await getNotificationRate(supabase, notification)
  const amount = Number(notification.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Invalid transaction amount')
    error.statusCode = 400
    throw error
  }

  return method === 'usdt' ? amount : amount / rate
}

async function getLocalWithdrawAmount(supabase, notification) {
  const { method, rate } = await getNotificationRate(supabase, notification)
  const amount = Number(notification.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Invalid transaction amount')
    error.statusCode = 400
    throw error
  }

  return method === 'usdt' ? amount : amount * rate
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const { uid, action } = req.body || {}
    if (!uid || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'error', message: 'Invalid finance action' })
    }

    const supabase = getSupabaseAdmin()
    const { data: notification, error: fetchErr } = await supabase
      .from('notification')
      .select('*')
      .eq('uid', uid)
      .single()

    if (fetchErr || !notification) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' })
    }

    if (['success', 'failed', 'processing'].includes(notification.sent) || notification.sent === true) {
      return res.status(409).json({ status: 'error', message: 'Transaction already processed' })
    }

    const isDeposit = notification.type === 'deposit'
    const isWithdraw = notification.type === 'withdraw' || notification.type === 'withdrawer'

    if (!isDeposit && !isWithdraw) {
      return res.status(400).json({ status: 'error', message: 'Unsupported transaction type' })
    }

    let approvedAmount = 0
    if (action === 'approve') {
      approvedAmount = isDeposit
        ? Number((await getUsdtAmount(supabase, notification)).toFixed(3))
        : Number((await getLocalWithdrawAmount(supabase, notification)).toFixed(3))
    }

    const claimQuery = supabase
      .from('notification')
      .update({ sent: 'processing' })
      .eq('uid', uid)
      .select('uid')

    const { data: claimed, error: claimErr } = notification.sent === null || notification.sent === undefined
      ? await claimQuery.is('sent', null).maybeSingle()
      : await claimQuery.eq('sent', notification.sent).maybeSingle()

    if (claimErr) throw claimErr
    if (!claimed) {
      return res.status(409).json({ status: 'error', message: 'Transaction already being processed' })
    }

    if (action === 'reject') {
      if (isWithdraw) {
        const refundAmount = Number(notification.amount) / 0.93
        await callInternalRpc(req, 'depositor', {
          names: notification.username,
          amount: Number(refundAmount.toFixed(3)),
        })
      }

      const { error } = await supabase
        .from('notification')
        .update({ sent: 'failed' })
        .eq('uid', uid)

      if (error) throw error

      return res.status(200).json({ status: 'success', sent: 'failed' })
    }

    if (isDeposit) {
      const depositAmount = approvedAmount

      await callInternalRpc(req, 'depositor', {
        names: notification.username,
        amount: depositAmount,
      })
      await callInternalRpc(req, 'gatherd', {
        names: notification.username,
        amount: depositAmount,
      })
      await callInternalRpc(req, 'readdeposit', { amount: depositAmount })
      await callInternalRpc(req, 'deposits', { name: notification.username })

      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('firstd,refer,lvla,lvlb')
        .eq('username', notification.username)
        .single()

      if (userErr) throw userErr

      if (!user.firstd) {
        await callInternalRpc(req, 'refbonus', {
          amount: depositAmount,
          name: notification.username,
          refers: user.refer,
          lvls: user.lvla,
          lvlss: user.lvlb,
        })
      }

      const { error: activityErr } = await supabase
        .from('useractivity')
        .insert({
          type: 'deposit',
          amount: depositAmount,
          user: notification.username,
          count: 0,
        })

      if (activityErr) throw activityErr
    } else {
      const withdrawAmount = approvedAmount

      await callInternalRpc(req, 'gatherw', {
        names: notification.username,
        amount: withdrawAmount,
      })
      await callInternalRpc(req, 'readwithdraw', { amount: withdrawAmount })

      const { error: activityErr } = await supabase
        .from('useractivity')
        .insert({
          type: 'withdraw',
          amount: Number(notification.amount),
          user: notification.username,
          count: 0,
        })

      if (activityErr) throw activityErr
    }

    const { error } = await supabase
      .from('notification')
      .update({ sent: 'success' })
      .eq('uid', uid)

    if (error) throw error

    return res.status(200).json({ status: 'success', sent: 'success' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Finance action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
