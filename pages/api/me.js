import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { calculateVipProgress } from '@/lib/vip'
import { getCurrencySettings } from '@/lib/currency'
import { isActiveMember } from '@/lib/membership'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'

const PROFILE_COLUMNS = 'userid,uid,username,email,phone,countrycode,balance,totald,totalw,newrefer,refer,lvla,lvlb,firstd,dailywl,codeset'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    res.setHeader('Cache-Control', 'private, no-store')
    const user = await getCurrentUser(req)
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'read_customer_profile', { p_userid: user.id })
    const currency = await getCurrencySettings()

    if (error) {
      throw error
    }

    const { profile, membershipBalanceThreshold } = data
    const referralCount = data.referralCount || 0
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
})
