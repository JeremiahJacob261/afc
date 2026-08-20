import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { calculateVipProgress } from '@/lib/vip'
import { getMembershipBalanceThreshold } from '@/lib/adminSettings'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'newrefer,totald')
    const membershipBalanceThreshold = await getMembershipBalanceThreshold(supabase)
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('refer', profile.newrefer)
      .gte('balance', membershipBalanceThreshold)

    if (error) throw error

    const vip = calculateVipProgress(profile.totald || 0, count || 0)
    return res.status(200).json({
      status: 'success',
      viplevel: String(vip.viplevel),
      referralCount: count || 0,
      vip,
      membershipBalanceThreshold,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
