import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)

    const { functionName } = req.query
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc(functionName, req.body || {})

    if (error) throw error

    return res.status(200).json({ status: 'success', data })
  } catch (error) {
    console.error('RPC fallback error:', error)
    return sendApiError(res, error)
  }
}
