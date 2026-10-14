import { supabase } from '@/pages/api/supabase'
import { privateRequests, responseSnapshot, restoreResponse } from './requestCache'
import { recordOperation } from './operationTiming'

let cacheUser = null
let cacheToken = null
let dataRevision = 0
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user?.id || null
    const nextToken = session?.access_token || null
    if (nextUser !== cacheUser || nextToken !== cacheToken || _event === 'SIGNED_OUT') {
      privateRequests.clear()
      if (_event === 'SIGNED_OUT' || cacheUser !== null && nextUser !== cacheUser) {
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

let sessionRead = null
export function readClientSession() {
  if (!sessionRead) sessionRead = supabase.auth.getSession().finally(() => { sessionRead = null })
  return sessionRead
}

const mutationReads = {
  '/api/place-bet': ['/api/my-bets', '/api/notify'],
  '/api/withdraw': ['/api/my-transactions', '/api/notify'],
  '/api/create-deposit': ['/api/my-transactions', '/api/notify'],
  '/api/bindwallet': [], '/api/set-pin': [], '/api/wheel-spin': ['/api/notify'], '/api/notify': ['/api/notify'],
}

function applyConfirmedMutation(path, payload, userId) {
  const result = Array.isArray(payload) ? payload[0] : payload
  if (String(result?.status || '').toLowerCase() !== 'success') return
  dataRevision++
  if (!(path in mutationReads)) { invalidateUserData(); return }
  const invalidated = mutationReads[path]
  privateRequests.invalidateWhere(key => key.startsWith(`${userId}:`) && invalidated.some(url => key.split(':').slice(1).join(':').split('?')[0] === url))
  if (Number.isFinite(result.balance) || path === '/api/set-pin') {
    privateRequests.updateWhere(key => key === `${userId}:/api/me`, snapshot => {
      const data = JSON.parse(snapshot.body)
      if (Number.isFinite(result.balance)) {
        data.profile.balance = result.balance
        data.profile.isActive = result.balance >= data.membershipBalanceThreshold
        if (path === '/api/place-bet') data.profile.gcount = Number(data.profile.gcount || 0) + (result.reused ? 0 : 1)
      }
      if (path === '/api/set-pin') data.profile.codeset = true
      return { ...snapshot, body: JSON.stringify(data) }
    })
  }
}

export async function getAccessToken() {
  const { data, error } = await readClientSession()
  if (error || !data?.session?.access_token) {
    return null
  }
  return data.session.access_token
}

export async function authFetch(url, options = {}, accessToken) {
  const { data } = await readClientSession()
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

  const load = async () => {
    const start = performance.now()
    const response = await fetch(url, { ...fetchOptions, headers })
    recordOperation(String(url).split('?')[0], start, response)
    return response
  }
  const method = (options.method || 'GET').toUpperCase()
  const pathname = String(url).split('?')[0]
  const ttl = privateTtls[pathname]
  if (method !== 'GET' || !userId || !ttl || typeof window === 'undefined') {
    const response = await load()
    if (method !== 'GET' && userId && (cacheUser !== userId || cacheToken !== token)) return new Response(null, { status: 401 })
    if (method !== 'GET' && response.ok && userId === cacheUser && token === cacheToken) {
      try { applyConfirmedMutation(pathname, await response.clone().json(), userId) }
      catch { invalidateUserData() }
    }
    return response
  }
  try {
    const revision = dataRevision
    const snapshot = await privateRequests.get(`${userId}:${url}`, () => responseSnapshot(load), {
      ttl, force: fresh || options.cache === 'no-store',
    })
    // A response completing after logout must not be consumed by a new account.
    if (cacheUser !== userId || cacheToken !== token) return new Response(null, { status: 401 })
    if (revision !== dataRevision) {
      privateRequests.invalidateWhere(key => key === `${userId}:${url}`)
      return authFetch(url, { ...options, fresh: true }, token)
    }
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
  const { data, error } = await readClientSession()
  if (error || !data?.session) {
    clearLegacyAuthStorage()
    router.push('/login')
    return null
  }
  return data.session
}
