import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { calculateVipProgress } from '@/lib/vip'
import { getCurrencySettings } from '@/lib/currency'
import { getMembershipBalanceThreshold } from '@/lib/adminSettings'
import { isActiveMember } from '@/lib/membership'

const PROFILE_COLUMNS = 'userid,uid,username,email,phone,countrycode,balance,totald,totalw,newrefer,refer,lvla,lvlb,firstd,dailywl,codeset'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, PROFILE_COLUMNS)
    const membershipBalanceThreshold = await getMembershipBalanceThreshold(supabase)
    const [{ count, error }, currency] = await Promise.all([
      supabase
      .from('users')
      .select('userid', { count: 'exact', head: true })
      .eq('refer', profile.newrefer)
      .gte('balance', membershipBalanceThreshold),
      getCurrencySettings(supabase),
    ])

    if (error) {
      throw error
    }

    const referralCount = count || 0
    const vip = calculateVipProgress(profile.totald || 0, referralCount)
    const isActive = isActiveMember(profile.balance, membershipBalanceThreshold)

    return res.status(200).json({
      status: 'success',
      profile: { ...profile, isActive },
      referralCount,
      vip,
      currency,
      membershipBalanceThreshold,
    })
  } catch (error) {
      console.error('Error fetching referral count:', error)
    return sendApiError(res, error)
  }
}
