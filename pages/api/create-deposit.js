import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import {
  displayPaymentCurrency,
  getPaymentMethod,
  getPaymentRate,
  isUsdtPaymentCode,
  methodCodeFromRow,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { amount, method, methodName, address, adminaddress, expectedRate } = req.body || {}
    const numericAmount = Number(amount)
    const requestedMethod = normalizePaymentCode(methodName || method)
    const requestedCode = normalizePaymentCode(method)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !requestedMethod || !requestedCode || !address || !adminaddress) {
      return res.status(400).json({ status: 'error', message: 'Invalid deposit details' })
    }

    const { profile, supabase } = await getCurrentProfile(req, 'username')
    // The receipt URL is reused by this flow on retry. Resolve a previous
    // accepted submission before checking today's method, rate, or destination.
    const { data: priorDeposits, error: lookupError } = await supabase
      .from('notification')
      .select('amount, method, adminaddress')
      .eq('username', profile.username)
      .eq('type', 'deposit')
      .eq('address', address)
      .limit(1)
    if (lookupError) throw lookupError
    if (priorDeposits?.length) {
      const prior = priorDeposits[0]
      if (Number(prior.amount) === numericAmount && normalizePaymentCode(prior.method) === requestedCode && prior.adminaddress === adminaddress) {
        return res.status(200).json({ status: 'success', reused: true })
      }
      return res.status(409).json({ status: 'error', message: 'This receipt was already used for another deposit' })
    }

    const savedMethod = await getPaymentMethod(supabase, requestedMethod, { requireAvailable: true })
    if (!savedMethod) {
      return res.status(400).json({ status: 'error', message: 'Unknown or unavailable deposit method' })
    }

    const notificationMethod = methodCodeFromRow(savedMethod) || requestedCode
    const rate = getPaymentRate(savedMethod, isUsdtPaymentCode(notificationMethod) ? 1 : 0)
    if (!rate) {
      return res.status(400).json({ status: 'error', message: 'Minimum deposit is 5 USDT equivalent' })
    }
    if (expectedRate != null && Number(expectedRate) !== rate) {
      return res.status(409).json({ status: 'error', code: 'rate_changed', message: 'Payment rate changed. Review the amount and payment details again.' })
    }
    if (numericAmount / rate < 5) {
      return res.status(400).json({ status: 'error', message: 'Minimum deposit is 5 USDT equivalent' })
    }

    const { data: savedDestinations, error: destinationError } = await supabase
      .from('depositwallet')
      .select('name, currency_code, address')
      .eq('address', adminaddress)
      .limit(10)
    if (destinationError) throw destinationError
    const matchingDestination = savedDestinations?.some((destination) => (
      normalizePaymentCode(destination.name) === normalizePaymentCode(savedMethod.name)
      || normalizePaymentCode(destination.currency_code) === notificationMethod
    ))
    if (!matchingDestination) {
      return res.status(400).json({ status: 'error', message: 'Payment destination is no longer available' })
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
