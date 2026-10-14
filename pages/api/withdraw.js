import { getCurrentUser } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { requestIdPattern, transactionError } from '@/lib/transactionErrors'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json([{ status: 'Failed', message: 'Method not allowed' }])
  try {
    const body = req.body || {}
    if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0
      || body.client_request_id && !requestIdPattern.test(body.client_request_id)
      || ['expectedRate', 'expectedFeePercent'].some(key => body[key] != null && !Number.isFinite(Number(body[key])))) {
      return res.status(400).json([{ status: 'Failed', message: 'Invalid amount or request id' }])
    }
    const user = await getCurrentUser(req)
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'submit_withdrawal_atomic', {
      p_userid: user.id, p_amount: Number(body.amount), p_pin: String(body.pass || ''), p_wallet: String(body.wallet || ''),
      p_method: String(body.method || 'usdt'), p_bank: body.bank || null, p_accountname: body.accountname || null,
      p_request_id: body.client_request_id || null,
      p_expected_rate: body.expectedRate == null ? null : Number(body.expectedRate),
      p_expected_fee_percent: body.expectedFeePercent == null ? null : Number(body.expectedFeePercent),
    })
    if (error) throw error
    return res.status(200).json([{ ...data, status: 'Success', message: 'Withdrawal Request as been sent' }])
  } catch (error) {
    const result = transactionError(error)
    const code = /24 hours/.test(result.message) ? 'WITHDRAWAL_COOLDOWN' : result.code
    const legacyBusinessFailure = code === 'PAYMENT_REQUEST_PENDING' || error.code === 'P0001'
      && /^(Wrong password|No transaction pin|Six bets|Insufficient funds|Minimum amount|Maximum amount|Daily withdrawal|Annual withdrawal|A successful withdrawal)|temporarily unavailable/.test(result.message)
    return res.status(legacyBusinessFailure ? 200 : result.status).json([{ status: 'Failed', message: result.message, ...(code ? { code } : {}) }])
  }
})
