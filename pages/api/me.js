import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { calculateVipProgress } from '@/lib/vip'

const PROFILE_COLUMNS = 'userid,uid,username,email,phone,countrycode,balance,totald,totalw,newrefer,refer,lvla,lvlb,firstd,dailywl,codeset'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, PROFILE_COLUMNS)
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .match({
        refer: profile.newrefer,
        firstd: true,
      })

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
    })
  } catch (error) {
      console.error('Error fetching referral count:', error)
    return sendApiError(res, error)
  }
}
