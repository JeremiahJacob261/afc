import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApiError } from '@/lib/apiAuth'

const PROFILE_COLUMNS = 'userid,uid,username,email,newrefer,password'

function publicProfile(profile) {
  if (!profile) return null

  const safeProfile = { ...profile }
  delete safeProfile.password
  return safeProfile
}

async function findUserByIdentifier(supabase, identifier) {
  const { data: usernameMatch, error: usernameError } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('username', identifier)
    .maybeSingle()

  if (usernameError) throw usernameError
  if (usernameMatch) return usernameMatch

  const { data: emailMatch, error: emailError } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('email', identifier)
    .maybeSingle()

  if (emailError) throw emailError
  return emailMatch
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const identifier = String(req.body?.identifier || '').trim()
    const password = String(req.body?.password || '')

    if (!identifier || !password) {
      return res.status(400).json({ status: 'error', message: 'Username/email and password are required' })
    }

    const supabase = getSupabaseAdmin()
    const profile = await findUserByIdentifier(supabase, identifier)

    if (!profile?.password || profile.password !== password) {
      return res.status(401).json({ status: 'error', message: 'Invalid login credentials' })
    }

    return res.status(200).json({
      status: 'success',
      profile: publicProfile(profile),
    })
  } catch (error) {
    console.error('Legacy login error:', error)
    return sendApiError(res, error)
  }
}
