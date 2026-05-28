import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function serializeError(error) {
  if (!error) return null
  return {
    message: error.message || 'Unknown error',
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    statusCode: error.statusCode || null,
  }
}

/**
 * RPC Function Replacement: depositor
 * Adds amount to user's balance
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { names, amount } = req.body
    const parsedAmount = parseFloat(amount)
    const logContext = {
      recipient: names || null,
      amount,
      amountType: typeof amount,
      parsedAmount,
      parsedAmountValid: Number.isFinite(parsedAmount),
    }

    console.log('[depositor] request:start', logContext)

    if (!names || amount === undefined) {
      console.warn('[depositor] request:missing-params', logContext)
      return res.status(400).json({ error: 'Missing required parameters: names, amount' })
    }

    // Fetch current user balance
    console.log('[depositor] user:lookup:start', { recipient: names })
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('balance')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('[depositor] user:lookup:error', {
        ...logContext,
        error: serializeError(fetchErr),
      })
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('[depositor] user:lookup:success', {
      ...logContext,
      balanceType: typeof user.balance,
      currentBalance: user.balance,
    })

    const newBalance = user.balance + parsedAmount
    console.log('[depositor] balance:computed', {
      ...logContext,
      balanceType: typeof user.balance,
      newBalance,
      newBalanceType: typeof newBalance,
    })

    // Update user balance
    const { error } = await supabase
      .from('users')
      .update({
        balance: newBalance
      })
      .eq('username', names)

    if (error) {
      console.error('[depositor] balance:update:error', {
        ...logContext,
        balanceType: typeof user.balance,
        newBalance,
        error: serializeError(error),
      })
      throw error
    }

    console.log('[depositor] balance:update:success', {
      recipient: names,
      parsedAmount,
      newBalance,
    })

    res.status(200).json({
      status: 'success',
      message: `Deposited ${amount} to user ${names}`,
      newBalance
    })
  } catch (error) {
    console.error('[depositor] request:error', serializeError(error))
    return sendApiError(res, error)
  }
}
