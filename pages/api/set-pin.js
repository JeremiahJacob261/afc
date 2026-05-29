import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

const PIN_LOCKED_MESSAGE = 'You already have a transaction PIN. Please contact admin to reset or change it.'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { pin } = req.body || {}
    if (!/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ status: 'error', message: 'Pin must be 4 digits' })
    }

    const { profile, supabase } = await getCurrentProfile(req, 'userid,codeset,pin')
    const hasExistingPin = Boolean(profile.codeset) || String(profile.pin || '').trim().length > 0

    if (hasExistingPin) {
      return res.status(409).json({ status: 'error', message: PIN_LOCKED_MESSAGE })
    }

    const { error } = await supabase
      .from('users')
      .update({ pin, codeset: true })
      .eq('userid', profile.userid)

    if (error) throw error

    return res.status(200).json({ status: 'success', message: 'You have successfully set a new Pin' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
