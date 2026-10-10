import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { notifyTeamMemberJoined } from '@/lib/pushNotifications'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  try {
    const user = await getCurrentUser(req)
    if (!user.email) return res.status(400).json({ status: 'error', message: 'Account email is required' })
    const body = req.body || {}
    // Auth owns identity; the database creates the profile and referral record in one transaction.
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('provision_native_profile_atomic', {
      p_userid: user.id,
      p_email: user.email,
      p_username: String(body.username || '').trim(),
      p_phone: String(body.phone || '').trim(),
      p_countrycode: String(body.countrycode || '').trim(),
      p_refer: String(body.refer || '').trim() || null,
    })
    if (error) {
      if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'Username or email already exists' })
      if (error.code === 'P0001') return res.status(400).json({ status: 'error', message: 'Invalid registration details or referral code' })
      throw error
    }
    if (data.created) {
      const { data: profile, error: profileError } = await supabase.from('users')
        .select('userid,username,refer,lvla,lvlb,newrefer').eq('userid', user.id).single()
      if (!profileError && profile) {
        try { await notifyTeamMemberJoined(supabase, profile) }
        catch { console.warn('Native registration team notification failed') }
      }
    }
    return res.status(200).json({ status: 'success', newrefer: data.newrefer })
  } catch (error) { return sendApiError(res, error) }
}
