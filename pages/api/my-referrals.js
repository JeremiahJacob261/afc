import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'newrefer')
    const { data, error } = await supabase
      .from('users')
      .select('keyf,username,totald,balance,firstd,refer,lvla,lvlb,crdate,created_at')
      .or(`refer.eq.${profile.newrefer},lvla.eq.${profile.newrefer},lvlb.eq.${profile.newrefer}`)

    if (error) throw error

    return res.status(200).json({
      status: 'success',
      refer: profile.newrefer,
      referrals: data || [],
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
