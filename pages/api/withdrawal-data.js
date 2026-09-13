import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings } from '@/lib/adminSettings'
import { getCurrencySettings } from '@/lib/currency'
import { getWithdrawalEligibility, isWithdrawalLimitExempt } from '@/lib/withdrawalEligibility'

const PROFILE_COLUMNS = 'userid,uid,username,balance'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, PROFILE_COLUMNS)
    const walletOwnerId = String(profile.uid || profile.userid || '').trim()

    const [walletsResult, methodsResult, settings, currency] = await Promise.all([
      walletOwnerId
        ? supabase
            .from('user_wallets')
            .select('*')
            .eq('uid', walletOwnerId)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('walle')
        .select('*')
        .eq('available', true),
      getWithdrawalSettings(supabase, { allowDefaultOnMissingTable: true }),
      getCurrencySettings(supabase),
    ])

    if (walletsResult.error) throw walletsResult.error
    if (methodsResult.error) throw methodsResult.error

    const withdrawalEligibility = await getWithdrawalEligibility(
      supabase,
      profile.username,
      { exempt: isWithdrawalLimitExempt(profile.username, settings) }
    )

    return res.status(200).json({
      status: 'success',
      profile,
      wallets: walletsResult.data || [],
      methods: methodsResult.data || [],
      settings,
      currency,
      withdrawalEligibility,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
