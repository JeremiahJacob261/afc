import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings } from '@/lib/adminSettings'
import { getCurrencySettings } from '@/lib/currency'
import { getWithdrawalEligibility, isWithdrawalLimitExempt } from '@/lib/withdrawalEligibility'
import { getPendingPaymentRequest } from '@/lib/pendingPaymentRequest'

function publicFields(row, keys) {
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(row, key)).map((key) => [key, row[key]]))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    res.setHeader('Cache-Control', 'no-store')
    const { profile, supabase } = await getCurrentProfile(req, 'userid,uid,username')
    const walletOwnerId = String(profile.uid || profile.userid || '').trim()

    const [methodsResult, destinationsResult, walletsResult, settings, currency] = await Promise.all([
      supabase
        .from('walle')
        .select('*')
        .eq('available', true),
      supabase
        .from('depositwallet')
        .select('*'),
      walletOwnerId
        ? supabase
            .from('user_wallets')
            .select('*')
            .eq('uid', walletOwnerId)
        : Promise.resolve({ data: [], error: null }),
      getWithdrawalSettings(supabase, { allowDefaultOnMissingTable: true }),
      getCurrencySettings(supabase),
    ])

    if (methodsResult.error) throw methodsResult.error
    if (destinationsResult.error) throw destinationsResult.error
    if (walletsResult.error) throw walletsResult.error

    const [withdrawalEligibility, pendingPaymentRequest] = await Promise.all([
      getWithdrawalEligibility(supabase, profile.username, { exempt: isWithdrawalLimitExempt(profile.username, settings) }),
      getPendingPaymentRequest(supabase, profile.username),
    ])

    return res.status(200).json({
      status: 'success',
      methods: (methodsResult.data || []).map((row) => publicFields(row, ['id', 'name', 'currency_code', 'type', 'rates', 'available', 'image', 'notes'])),
      destinations: (destinationsResult.data || []).map((row) => publicFields(row, ['id', 'name', 'currency_code', 'type', 'address', 'bank', 'accountname', 'image'])),
      wallets: (walletsResult.data || []).map((row) => publicFields(row, ['id', 'wallet', 'walletnames', 'bank', 'names', 'method'])),
      settings: publicFields(settings, ['withdrawalsEnabled', 'minWithdrawalAmount', 'maxWithdrawalAmount', 'withdrawalFeePercent', 'withdrawalDisabledMessage', 'dailyWithdrawalLimit', 'annualWithdrawalLimit']),
      currency,
      withdrawalEligibility,
      pendingPaymentRequest: pendingPaymentRequest ? { type: pendingPaymentRequest.type } : null,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
