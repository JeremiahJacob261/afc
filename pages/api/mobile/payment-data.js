import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings } from '@/lib/adminSettings'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'userid,uid')
    const walletOwnerId = String(profile.uid || profile.userid || '').trim()

    const [methodsResult, destinationsResult, walletsResult, settings] = await Promise.all([
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
    ])

    if (methodsResult.error) throw methodsResult.error
    if (destinationsResult.error) throw destinationsResult.error
    if (walletsResult.error) throw walletsResult.error

    return res.status(200).json({
      status: 'success',
      methods: methodsResult.data || [],
      destinations: destinationsResult.data || [],
      wallets: walletsResult.data || [],
      settings,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
