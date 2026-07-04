import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const token = String(req.body?.token || '').trim()
    if (!token) {
      return res.status(200).json({ status: 'success' })
    }

    const { user, supabase } = await getCurrentProfile(req, 'userid,username')
    const { error } = await supabase
      .from('push_tokens')
      .update({
        enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('token', token)

    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
