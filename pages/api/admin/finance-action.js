import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'
import { getFirstDepositBonusPercent } from '@/lib/adminSettings'
import {
  getPaymentMethod,
  getPaymentRate,
  normalizePaymentCode,
} from '@/lib/paymentMethods'
import { notifyFinanceAction } from '@/lib/pushNotifications'

async function getNotificationRate(supabase, notification) {
  const method = normalizePaymentCode(notification.method || 'fcfa')
  const savedMethod = await getPaymentMethod(supabase, method)
  const fallback = ['fcfa', 'xof', 'cfa'].includes(method) ? 1 : 0
  const rate = getPaymentRate(savedMethod, fallback)

  if (!rate) {
    const error = new Error(`No saved rate found for ${method.toUpperCase()}`)
    error.statusCode = 400
    throw error
  }

  return { method, rate }
}

async function getLedgerAmount(supabase, notification) {
  const { method, rate } = await getNotificationRate(supabase, notification)
  const amount = Number(notification.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Invalid transaction amount')
    error.statusCode = 400
    throw error
  }

  return amount / rate
}

async function getLocalWithdrawAmount(supabase, notification) {
  const { method, rate } = await getNotificationRate(supabase, notification)
  const amount = Number(notification.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Invalid transaction amount')
    error.statusCode = 400
    throw error
  }

  return amount * rate
}

function normalizedSent(sent) {
  return String(sent ?? 'pending').toLowerCase()
}

function isLockedStatus(sent) {
  return ['success', 'failed', 'processing', 'true', 'false', 'completed'].includes(normalizedSent(sent))
}

function getFinanceActionStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('not found') || message.includes('Profile not found')) return 404
  if (message.includes('already processed') || message.includes('already being processed')) return 409
  if (
    message.includes('Invalid')
    || message.includes('Unsupported')
    || message.includes('must be between')
  ) {
    return 400
  }

  return error?.statusCode || 500
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const { id, uid, action } = req.body || {}
    const transactionId = id ?? uid
    const hasId = id !== undefined && id !== null && id !== ''
    const idColumn = hasId ? 'id' : 'uid'

    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'error', message: 'Invalid finance action' })
    }

    const rpcId = hasId ? Number(id) : null
    if (hasId && !Number.isSafeInteger(rpcId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid finance action' })
    }

    const supabase = getSupabaseAdmin()
    const { data: notification, error: fetchErr } = await supabase
      .from('notification')
      .select('*')
      .eq(idColumn, transactionId)
      .single()

    if (fetchErr || !notification) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' })
    }

    const isDeposit = notification.type === 'deposit'
    const isWithdraw = notification.type === 'withdraw' || notification.type === 'withdrawer'

    if (!isDeposit && !isWithdraw) {
      return res.status(400).json({ status: 'error', message: 'Unsupported transaction type' })
    }

    let approvedAmount = 0
    let firstDepositBonusPercent = null
    if (action === 'approve' && !isLockedStatus(notification.sent)) {
      approvedAmount = isDeposit
        ? Number((await getLedgerAmount(supabase, notification)).toFixed(3))
        : Number((await getLocalWithdrawAmount(supabase, notification)).toFixed(3))

      if (isDeposit) {
        firstDepositBonusPercent = await getFirstDepositBonusPercent(supabase)
      }
    }

    const { data: result, error: rpcErr } = await supabase.rpc('process_finance_action_atomic', {
      p_action: action,
      p_id: rpcId,
      p_uid: hasId ? null : uid,
      p_approved_amount: approvedAmount || null,
      p_first_deposit_bonus_percent: firstDepositBonusPercent,
    })

    if (rpcErr) throw rpcErr

    const finalSent = result?.sent || (action === 'reject' ? 'failed' : 'success')
    if (!result?.alreadyProcessed) {
      try {
        await notifyFinanceAction(supabase, {
          transaction: notification,
          action,
          sent: finalSent,
          amount: approvedAmount || notification.amount,
        })
      } catch (pushError) {
        console.warn('Finance push notification failed:', pushError)
      }
    }

    return res.status(200).json({
      status: 'success',
      sent: finalSent,
      alreadyProcessed: Boolean(result?.alreadyProcessed),
    })
  } catch (error) {
    const status = getFinanceActionStatus(error)
    const message = status === 500 ? 'Server error' : error.message
    console.error('Finance action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
