import { getSupabaseAdmin } from './supabaseAdmin'

export function getBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' ? token : null
}

export async function getCurrentUser(req) {
  const token = getBearerToken(req)

  if (!token) {
    const error = new Error('Authentication required')
    error.statusCode = 401
    throw error
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    const authError = new Error('Invalid or expired session')
    authError.statusCode = 401
    throw authError
  }

  return data.user
}

export async function getCurrentProfile(req, columns = '*') {
  const user = await getCurrentUser(req)
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('users')
    .select(columns)
    .eq('userid', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    const profileError = new Error('Profile not found')
    profileError.statusCode = 404
    throw profileError
  }

  return { user, profile: data, supabase }
}

export function sendApiError(res, error) {
  const status = error.statusCode || 500
  const message = status === 500 ? 'Server error' : error.message
  return res.status(status).json({ status: 'error', message })
}

export function requireInternalSecret(req) {
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers['x-internal-secret']

  if (!expected || provided !== expected) {
    const error = new Error('Internal authorization required')
    error.statusCode = 401
    throw error
  }
}
