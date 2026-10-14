import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getPaymentMethod, getPaymentRate, isUsdtPaymentCode, methodCodeFromRow, toLedgerAmount } from '@/lib/paymentMethods'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  try {
    await getCurrentUser(req)
    const supabase = getSupabaseAdmin()
    const amount = Number(req.query.amount)
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ status: 'error', message: 'Invalid amount' })
    const method = await getPaymentMethod(supabase, req.query.method, { requireAvailable: true })
    if (!method) return res.status(400).json({ status: 'error', message: 'Payment method unavailable' })
    const rate = getPaymentRate(method, isUsdtPaymentCode(methodCodeFromRow(method)) ? 1 : 0)
    const ledgerAmount = toLedgerAmount(amount, rate)
    if (!rate || ledgerAmount == null) return res.status(409).json({ status: 'error', message: 'Rate unavailable' })
    return res.status(200).json({ status: 'success', rate, ledgerAmount, valid: ledgerAmount >= 25000 })
  } catch (error) { return sendApiError(res, error) }
}
