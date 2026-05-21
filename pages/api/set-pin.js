import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { pin } = req.body || {}
    if (!/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ status: 'error', message: 'Pin must be 4 digits' })
    }

    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const { error } = await supabase
      .from('users')
      .update({ pin, codeset: true })
      .eq('username', profile.username)

    if (error) throw error

    return res.status(200).json({ status: 'success', message: 'You have successfully set a new Pin' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
