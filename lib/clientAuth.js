import { supabase } from '@/pages/api/supabase'

const LEGACY_AUTH_KEYS = {
  signedIn: 'signedIns',
  userid: 'signUids',
  username: 'signNames',
  ref: 'signRef',
}

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    return null
  }
  return data.session.access_token
}

export function readLegacyAuthStorage() {
  if (typeof window === 'undefined') return null

  const signedIn = localStorage.getItem(LEGACY_AUTH_KEYS.signedIn)
  const username = localStorage.getItem(LEGACY_AUTH_KEYS.username)
  if (signedIn !== 'true' || !username) return null

  return {
    signedIn,
    userid: localStorage.getItem(LEGACY_AUTH_KEYS.userid) || '',
    username,
    ref: localStorage.getItem(LEGACY_AUTH_KEYS.ref) || '',
  }
}

export function writeLegacyAuthStorage(profile) {
  if (typeof window === 'undefined' || !profile?.username) return

  localStorage.setItem(LEGACY_AUTH_KEYS.signedIn, 'true')
  localStorage.setItem(LEGACY_AUTH_KEYS.userid, profile.userid || profile.id || '')
  localStorage.setItem(LEGACY_AUTH_KEYS.username, profile.username)
  localStorage.setItem(LEGACY_AUTH_KEYS.ref, profile.newrefer || profile.ref || '')
}

function buildAuthHeaders(headers, token, legacyAuth = readLegacyAuthStorage()) {
  const nextHeaders = new Headers(headers || {})

  if (token) {
    nextHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (legacyAuth) {
    nextHeaders.set('x-legacy-signed-in', legacyAuth.signedIn)
    nextHeaders.set('x-legacy-userid', legacyAuth.userid)
    nextHeaders.set('x-legacy-username', legacyAuth.username)
    nextHeaders.set('x-legacy-ref', legacyAuth.ref)
  }

  return nextHeaders
}

async function hydrateLegacyAuthFromSession(session) {
  const token = session?.access_token
  if (!token || readLegacyAuthStorage()) return

  try {
    const response = await fetch('/api/me', {
      headers: buildAuthHeaders(null, token, null),
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok && result.status === 'success') {
      writeLegacyAuthStorage(result.profile)
    }
  } catch (error) {
    console.error('Unable to migrate Supabase session to legacy auth', error)
  }
}

export async function authFetch(url, options = {}) {
  const token = await getAccessToken()
  const headers = buildAuthHeaders(options.headers, token)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearLegacyAuthStorage()
  }

  return response
}

export function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('signedIns')
  localStorage.removeItem('signUids')
  localStorage.removeItem('signNames')
  localStorage.removeItem('signRef')
}

export async function requireSession(router) {
  const legacyAuth = readLegacyAuthStorage()
  if (legacyAuth) {
    return { legacy: true, profile: legacyAuth }
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session) {
    clearLegacyAuthStorage()
    router.push('/login')
    return null
  }
  await hydrateLegacyAuthFromSession(data.session)
  return data.session
}
