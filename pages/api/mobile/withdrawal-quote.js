import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { parseCurrency } from '@/lib/currency'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  try {
    const { supabase } = await getCurrentProfile(req, 'userid')
    const amount = parseCurrency(req.query.amount)
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ status: 'error', message: 'Invalid amount' })
    const { data, error } = await supabase.rpc('quote_withdrawal_amounts', { p_amount: amount })
    if (error) throw error
    return res.status(200).json({ status: 'success', requestedAmount: data.amount, feeAmount: data.fee, totalAmount: data.total })
  } catch (error) { return sendApiError(res, error) }
}
