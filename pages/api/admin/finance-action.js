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

async function setTransactionStatus(supabase, idColumn, transactionId, sent) {
  const { error } = await supabase
    .from('notification')
    .update({ sent })
    .eq(idColumn, transactionId)

  if (error) throw error
}

async function runBookkeeping(label, task, warnings) {
  try {
    await task()
  } catch (error) {
    console.error(`Finance ${label} bookkeeping failed:`, error)
    warnings.push(label)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const { id, uid, action } = req.body || {}
    const transactionId = id ?? uid
    const idColumn = id ? 'id' : 'uid'

    if (!transactionId || !['approve', 'reject'].includes(action)) {
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
      .eq(idColumn, transactionId)
      .select(idColumn)

    const { data: claimed, error: claimErr } = notification.sent === null || notification.sent === undefined
      ? await claimQuery.is('sent', null).maybeSingle()
      : await claimQuery.eq('sent', notification.sent).maybeSingle()

    if (claimErr) throw claimErr
    if (!claimed) {
      return res.status(409).json({ status: 'error', message: 'Transaction already being processed' })
    }

    let moneyMoved = false
    const warnings = []

    try {
      if (action === 'reject') {
        if (isWithdraw) {
          const refundAmount = Number(notification.amount) / 0.93
          await callInternalRpc(req, 'depositor', {
            names: notification.username,
            amount: Number(refundAmount.toFixed(3)),
          })
          moneyMoved = true
        }

        await setTransactionStatus(supabase, idColumn, transactionId, 'failed')
        return res.status(200).json({ status: 'success', sent: 'failed' })
      }

      if (isDeposit) {
        const depositAmount = approvedAmount

        await callInternalRpc(req, 'depositor', {
          names: notification.username,
          amount: depositAmount,
        })
        moneyMoved = true

        await runBookkeeping('deposit total', () => callInternalRpc(req, 'gatherd', {
          names: notification.username,
          amount: depositAmount,
        }), warnings)
        await runBookkeeping('global deposit total', () => callInternalRpc(req, 'readdeposit', { amount: depositAmount }), warnings)
        await runBookkeeping('deposit count', () => callInternalRpc(req, 'deposits', { name: notification.username }), warnings)

        await runBookkeeping('referral bonus', async () => {
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
        }, warnings)

        await runBookkeeping('activity log', async () => {
          const { error: activityErr } = await supabase
            .from('activa')
            .insert({
              code: 'finance',
              username: notification.username,
              type: 'deposit',
              amount: depositAmount,
            })

          if (activityErr) throw activityErr
        }, warnings)
      } else {
        const withdrawAmount = approvedAmount

        await runBookkeeping('withdraw total', () => callInternalRpc(req, 'gatherw', {
          names: notification.username,
          amount: withdrawAmount,
        }), warnings)
        await runBookkeeping('global withdraw total', () => callInternalRpc(req, 'readwithdraw', { amount: withdrawAmount }), warnings)
        await runBookkeeping('activity log', async () => {
          const { error: activityErr } = await supabase
            .from('activa')
            .insert({
              code: 'finance',
              username: notification.username,
              type: 'withdraw',
              amount: Number(notification.amount),
            })

          if (activityErr) throw activityErr
        }, warnings)
      }

      await setTransactionStatus(supabase, idColumn, transactionId, 'success')

      return res.status(200).json({
        status: 'success',
        sent: 'success',
        warning: warnings.length ? 'Transaction confirmed, but some bookkeeping needs review' : undefined,
        warnings: warnings.length ? warnings : undefined,
      })
    } catch (error) {
      if (moneyMoved) {
        const finalSent = action === 'reject' ? 'failed' : 'success'
        await setTransactionStatus(supabase, idColumn, transactionId, finalSent)
        return res.status(200).json({
          status: 'success',
          sent: finalSent,
          warning: 'Transaction confirmed, but some bookkeeping needs review',
        })
      }

      await setTransactionStatus(supabase, idColumn, transactionId, notification.sent ?? null)
      throw error
    }
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Finance action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
