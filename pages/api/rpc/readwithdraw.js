import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const amount = Number(req.body?.amount)

    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'Missing or invalid amount' })
    }

    const { data, error: fetchErr } = await supabase
      .from('reading')
      .select('withdraw')
      .eq('id', 1)
      .single()

    if (fetchErr) throw fetchErr

    const nextWithdraw = Number(data.withdraw || 0) + amount
    const { error } = await supabase
      .from('reading')
      .update({ withdraw: nextWithdraw })
      .eq('id', 1)

    if (error) throw error

    return res.status(200).json({ status: 'success', withdraw: nextWithdraw })
  } catch (error) {
    console.error('Readwithdraw error:', error)
    return sendApiError(res, error)
  }
}
