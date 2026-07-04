import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

function cleanText(value) {
  return String(value || '').trim()
}

const supportedLanguages = new Set(['en', 'fr', 'es', 'my', 'ru', 'ar'])

function cleanLanguage(value) {
  const language = cleanText(value || 'en').toLowerCase()
  return supportedLanguages.has(language) ? language : 'en'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const token = cleanText(req.body?.token)
    const platform = cleanText(req.body?.platform || 'android').toLowerCase()
    const deviceId = cleanText(req.body?.deviceId)
    const language = cleanLanguage(req.body?.language)

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Missing push token' })
    }

    const { user, profile, supabase } = await getCurrentProfile(req, 'userid,username')
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        username: profile.username,
        token,
        platform: platform || 'android',
        device_id: deviceId || null,
        language,
        enabled: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token',
      })

    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
