import { getCurrentUser } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { requestIdPattern, transactionError } from '@/lib/transactionErrors'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  try {
    const { amount, method, methodName, address, adminaddress, expectedRate, client_request_id } = req.body || {}
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !method || !address || !adminaddress
      || expectedRate != null && (!Number.isFinite(Number(expectedRate)) || Number(expectedRate) <= 0)
      || client_request_id && !requestIdPattern.test(client_request_id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid deposit details' })
    }
    const user = await getCurrentUser(req)
    let receipt
    try { receipt = new URL(String(address)) }
    catch { return res.status(400).json({ status: 'error', message: 'Invalid receipt URL' }) }
    const bucketPrefix = '/storage/v1/object/public/trcreceipt/'
    const path = decodeURIComponent(receipt.pathname.slice(bucketPrefix.length))
    if (receipt.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin || !receipt.pathname.startsWith(bucketPrefix)
      || path.startsWith('web/') && !path.startsWith(`web/${user.id}/`)
      || path.startsWith('public/web/') && !path.startsWith(`public/web/${user.id}/`)
      || path.startsWith('native/') && !path.startsWith(`native/${user.id}/`)) {
      return res.status(400).json({ status: 'error', message: 'Invalid receipt URL' })
    }
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'create_deposit_request_atomic', {
      p_userid: user.id, p_amount: Number(amount), p_method: String(method), p_method_name: String(methodName || method),
      p_receipt: String(address), p_destination: String(adminaddress),
      p_expected_rate: expectedRate == null ? null : Number(expectedRate), p_request_id: client_request_id || null,
    })
    if (error) throw error
    return res.status(200).json(data)
  } catch (error) {
    const result = transactionError(error)
    return res.status(result.status).json({ status: 'error', message: result.message, ...(result.code ? { code: result.code } : {}) })
  }
})
