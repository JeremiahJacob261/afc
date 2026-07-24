import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import {
  displayPaymentCurrency,
  getPaymentMethod,
  getPaymentRate,
  isFcfaPaymentCode,
  methodCodeFromRow,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { amount, method, methodName, address, adminaddress } = req.body || {}
    const numericAmount = Number(amount)
    const requestedMethod = normalizePaymentCode(methodName || method)
    const requestedCode = normalizePaymentCode(method)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !requestedMethod || !requestedCode || !address) {
      return res.status(400).json({ status: 'error', message: 'Invalid deposit details' })
    }

    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const savedMethod = await getPaymentMethod(supabase, requestedMethod, { requireAvailable: true })
    if (!savedMethod) {
      return res.status(400).json({ status: 'error', message: 'Unknown or unavailable deposit method' })
    }

    const notificationMethod = methodCodeFromRow(savedMethod) || requestedCode
    const rate = getPaymentRate(savedMethod, isFcfaPaymentCode(notificationMethod) ? 1 : 0)
    if (!rate || numericAmount / rate < 3000) {
      return res.status(400).json({ status: 'error', message: 'Minimum deposit is 3,000 FCFA equivalent' })
    }

    const { error } = await supabase
      .from('notification')
      .insert({
        username: profile.username,
        amount: numericAmount,
        type: 'deposit',
        sent: 'pending',
        method: notificationMethod,
        method_currency: displayPaymentCurrency(notificationMethod),
        method_rate: rate,
        address,
        adminaddress,
      })

    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
