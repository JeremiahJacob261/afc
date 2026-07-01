import { mobileConfig } from './config.js'
import { getAccessToken } from './supabase.js'

function toApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return new URL(path, mobileConfig.apiBaseUrl).toString()
}

export async function apiFetch(path, options = {}) {
  const { auth = false, body, headers, ...rest } = options
  const requestHeaders = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  }

  if (auth) {
    const token = await getAccessToken()
    if (!token) {
      const error = new Error('Please sign in again.')
      error.status = 401
      throw error
    }
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(toApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: body && typeof body !== 'string' ? JSON.stringify(body) : body,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(payload?.message || 'Network request failed.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
