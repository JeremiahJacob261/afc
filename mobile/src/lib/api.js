import { mobileConfig } from './config.js'
import { getAccessToken } from './supabase.js'
import { readAccountCurrency, needsAccountCurrency } from '../../../lib/accountCurrencyClient'

function toApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return new URL(path, mobileConfig.apiBaseUrl).toString()
}

export async function apiFetch(path, options = {}) {
  const { auth = false, body, headers, ...rest } = options
  const requestHeaders = {
    'x-account-currency-contract': '1',
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  }

  let requestToken = null
  if (auth) {
    const token = await getAccessToken()
    if (!token) {
      const error = new Error('Please sign in again.')
      error.status = 401
      error.code = 'SESSION_EXPIRED'
      throw error
    }
    requestHeaders.Authorization = `Bearer ${token}`
    requestToken = token
  }

  const response = await fetch(toApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: body && typeof body !== 'string' ? JSON.stringify(body) : body,
  })

  const payload = await response.json().catch(() => null)
  if (auth && await getAccessToken() !== requestToken) {
    throw Object.assign(new Error('The signed-in account changed. Please try again.'), { status: 401 })
  }
  const supported = readAccountCurrency(payload)
  if (response.ok && needsAccountCurrency(path) && !supported) throw new Error('The server needs the account currency update. Please try again after it is deployed.')

  if (!response.ok) {
    const failure = Array.isArray(payload) ? payload[0] : payload
    const error = new Error(failure?.message || 'Request could not be completed.')
    error.status = response.status
    error.code = failure?.code
    error.payload = failure
    throw error
  }

  if (payload == null) throw new Error('Response could not be verified')

  return payload
}
