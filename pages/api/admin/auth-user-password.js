import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const { userId, password } = req.body || {}
    const cleanUserId = String(userId || '').trim()
    const cleanPassword = String(password || '').replace(/\s/g, '')

    if (!cleanUserId || cleanPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'A valid user id and password are required' })
    }

    const supabase = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('userid,uid,username')
      .eq('userid', cleanUserId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(cleanUserId, { password: cleanPassword })
    if (authError) throw authError

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: cleanPassword })
      .eq('userid', cleanUserId)

    if (updateError) throw updateError

    console.info('Admin credential reset', {
      type: 'password',
      userId: cleanUserId,
      uid: profile.uid,
      username: profile.username,
      at: new Date().toISOString(),
    })

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin auth password error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
