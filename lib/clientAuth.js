import { supabase } from '@/pages/api/supabase'

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    return null
  }
  return data.session.access_token
}

export async function authFetch(url, options = {}) {
  const token = await getAccessToken()
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return fetch(url, {
    ...options,
    headers,
  })
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
    router.push('/signin')
    return null
  }
  return data.session
}
