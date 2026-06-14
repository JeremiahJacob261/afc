import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const { userId, pin } = req.body || {}
    const cleanUserId = String(userId || '').trim()
    const cleanPin = String(pin || '').trim()

    if (!cleanUserId || !/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ status: 'error', message: 'A valid user id and 4-digit PIN are required' })
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

    const { error: updateError } = await supabase
      .from('users')
      .update({ pin: cleanPin, codeset: true })
      .eq('userid', cleanUserId)

    if (updateError) throw updateError

    console.info('Admin credential reset', {
      type: 'pin',
      userId: cleanUserId,
      uid: profile.uid,
      username: profile.username,
      at: new Date().toISOString(),
    })

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin user PIN error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
