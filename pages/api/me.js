import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { calculateVipProgress } from '@/lib/vip'
import { getCurrencySettings } from '@/lib/currency'

const PROFILE_COLUMNS = 'userid,uid,username,email,phone,countrycode,balance,totald,totalw,newrefer,refer,lvla,lvlb,firstd,dailywl,codeset'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, PROFILE_COLUMNS)
    const [{ count, error }, currency] = await Promise.all([
      supabase
      .from('users')
      .select('userid', { count: 'exact', head: true })
      .eq('refer', profile.newrefer)
      .eq('firstd', true),
      getCurrencySettings(supabase),
    ])

    if (error) {
      throw error
    }

    const referralCount = count || 0
    const vip = calculateVipProgress(profile.totald || 0, referralCount)

    return res.status(200).json({
      status: 'success',
      profile,
      referralCount,
      vip,
      currency,
    })
  } catch (error) {
      console.error('Error fetching referral count:', error)
    return sendApiError(res, error)
  }
}
