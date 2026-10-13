import { supabase } from '@/pages/api/supabase'
import { privateRequests, responseSnapshot, restoreResponse } from './requestCache'

let cacheUser = null
let cacheToken = null
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user?.id || null
    const nextToken = session?.access_token || null
    if (nextUser !== cacheUser || nextToken !== cacheToken || _event === 'SIGNED_OUT') {
      privateRequests.clear()
      if (_event === 'SIGNED_OUT' || _event === 'SIGNED_IN' && nextUser !== cacheUser) {
        navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_USER_CACHE' })
      }
    }
    cacheUser = nextUser
    cacheToken = nextToken
  })
}

const privateTtls = {
  '/api/me': 15000,
  '/api/my-bets': 15000,
  '/api/my-transactions': 15000,
  '/api/my-referrals': 30000,
  '/api/notify': 15000,
}

export function invalidateUserData() { privateRequests.clear() }

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    return null
  }
  return data.session.access_token
}

export async function authFetch(url, options = {}, accessToken) {
  const { data } = await supabase.auth.getSession()
  const session = data?.session
  const userId = session?.user?.id || null
  const token = session?.access_token ?? accessToken
  if (cacheUser !== userId || cacheToken !== (token || null)) {
    privateRequests.clear(); cacheUser = userId; cacheToken = token || null
  }
  const { fresh = false, ...fetchOptions } = options
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const load = () => fetch(url, {
    ...fetchOptions,
    headers,
  })
  const method = (options.method || 'GET').toUpperCase()
  const pathname = String(url).split('?')[0]
  const ttl = privateTtls[pathname]
  if (method !== 'GET' || !userId || !ttl || typeof window === 'undefined') {
    const response = await load()
    if (method !== 'GET' && response.ok) invalidateUserData()
    return response
  }
  try {
    const snapshot = await privateRequests.get(`${userId}:${url}`, () => responseSnapshot(load), {
      ttl, force: fresh || options.cache === 'no-store',
    })
    // A response completing after logout must not be consumed by a new account.
    if (cacheUser !== userId || cacheToken !== token) return new Response(null, { status: 401 })
    return restoreResponse(snapshot)
  } catch (error) {
    if (cacheUser !== userId || cacheToken !== token) return new Response(null, { status: 401 })
    if (error.response) return error.response.clone()
    throw error
  }
}

export function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('signedIns')
  localStorage.removeItem('signUids')
  localStorage.removeItem('signNames')
  localStorage.removeItem('signRef')
}

export async function requireSession(router) {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session) {
    clearLegacyAuthStorage()
    router.push('/login')
    return null
  }
  return data.session
}
