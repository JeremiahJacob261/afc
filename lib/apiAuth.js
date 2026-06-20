import { getSupabaseAdmin } from './supabaseAdmin'

const PROFILE_ID_COLUMNS = ['userid', 'uid', 'username', 'email', 'newrefer']

function readHeaderValue(req, name) {
  const value = req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function addProfileIdColumns(columns) {
  if (!columns || columns === '*') return '*'

  const selected = new Set(
    columns
      .split(',')
      .map((column) => column.trim())
      .filter(Boolean)
  )

  for (const column of PROFILE_ID_COLUMNS) {
    selected.add(column)
  }

  return Array.from(selected).join(',')
}

function getLegacyAuth(req) {
  const signedIn = readHeaderValue(req, 'x-legacy-signed-in')
  const username = String(readHeaderValue(req, 'x-legacy-username') || '').trim()
  const userid = String(readHeaderValue(req, 'x-legacy-userid') || '').trim()
  const ref = String(readHeaderValue(req, 'x-legacy-ref') || '').trim()

  if (signedIn !== 'true' || !username) {
    return null
  }

  return { username, userid, ref }
}

function buildLegacyUser(profile) {
  return {
    id: profile.userid,
    email: profile.email,
    user_metadata: {
      displayName: profile.username,
    },
    legacy: true,
  }
}

async function getLegacyProfile(req, supabase, columns = '*') {
  const legacyAuth = getLegacyAuth(req)
  if (!legacyAuth) return null

  const { data, error } = await supabase
    .from('users')
    .select(addProfileIdColumns(columns))
    .eq('username', legacyAuth.username)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const authError = new Error('Invalid legacy session')
    authError.statusCode = 401
    throw authError
  }

  return data
}

export function getBearerToken(req) {
  const header = readHeaderValue(req, 'authorization') || ''
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' ? token : null
}

export async function getCurrentUser(req) {
  const supabase = getSupabaseAdmin()
  const legacyProfile = await getLegacyProfile(req, supabase, '*')
  if (legacyProfile) {
    return buildLegacyUser(legacyProfile)
  }

  const token = getBearerToken(req)

  if (!token) {
    const error = new Error('Authentication required')
    error.statusCode = 401
    throw error
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    const authError = new Error('Invalid or expired session')
    authError.statusCode = 401
    throw authError
  }

  return data.user
}

export async function getCurrentProfile(req, columns = '*') {
  const supabase = getSupabaseAdmin()

  const legacyProfile = await getLegacyProfile(req, supabase, columns)
  if (legacyProfile) {
    return {
      user: buildLegacyUser(legacyProfile),
      profile: legacyProfile,
      supabase,
    }
  }

  const user = await getCurrentUser(req)
  const { data, error } = await supabase
    .from('users')
    .select(addProfileIdColumns(columns))
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
  const expected = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  const provided = req.headers['x-internal-secret']

  if (!expected || provided !== expected) {
    const error = new Error('Internal authorization required')
    error.statusCode = 401
    throw error
  }
}
