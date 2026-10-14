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
  const start = performance.now()
  // Reads can verify asymmetric JWTs against the SDK's cached JWKS. Mutations
  // always fetch the current Auth user so revocation/bans are checked freshly.
  if (req.method === 'GET' && typeof supabase.auth.getClaims === 'function') {
    const { data, error } = await supabase.auth.getClaims(token)
    req.timings?.push(['auth', performance.now() - start])
    const claims = data?.claims
    if (error || !claims?.sub || claims.role !== 'authenticated'
      || claims.iss !== `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')}/auth/v1`) {
      const authError = new Error('Invalid or expired session')
      authError.statusCode = 401
      throw authError
    }
    return { id: claims.sub, email: claims.email }
  }
  const { data, error } = await supabase.auth.getUser(token)
  req.timings?.push(['auth', performance.now() - start])

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
  const status = error.statusCode || (error?.code === 'P0001' && error.message === 'Profile not found' ? 404 : 500)
  const message = status === 500 ? 'Server error' : error.message
  return res.status(status).json({ status: 'error', message })
}

export function requireInternalSecret(req) {
  const expected = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  const provided = req.headers['x-internal-secret']

  if (!expected || provided !== expected) {
    const error = new Error('Internal authorization required')
    error.statusCode = 401
    throw error
  }
}
