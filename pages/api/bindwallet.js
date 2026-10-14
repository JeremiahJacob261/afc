import { getCurrentUser } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { transactionError } from '@/lib/transactionErrors'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'failed', message: 'Method not allowed' })
  try {
    const user = await getCurrentUser(req)
    const body = req.body || {}
    if (body.methodId && (!Number.isSafeInteger(Number(body.methodId)) || Number(body.methodId) <= 0)) {
      return res.status(400).json({ status: 'failed', message: 'Payment method is not available' })
    }
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'bind_wallet_atomic', {
      p_userid: user.id, p_method_id: body.methodId ? Number(body.methodId) : null, p_method_name: body.walletname || null,
      p_wallet: String(body.wallet || ''), p_bank: String(body.bank || ''), p_name: String(body.name || ''),
    })
    if (error) throw error
    return res.status(200).json(data)
  } catch (error) {
    const result = transactionError(error)
    return res.status(result.status).json({ status: 'failed', message: result.message })
  }
})
