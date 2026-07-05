import { createClient } from '@supabase/supabase-js'
import { hasSupabaseConfig, mobileConfig } from './config.js'
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from './storage.js'

const authStorageKey = 'efc-mobile-auth'
const defaultSessionTimeoutMs = 6000

const mobileAuthStorage = {
  getItem(key) {
    return getLocalStorageItem(key, null)
  },
  setItem(key, value) {
    setLocalStorageItem(key, value)
  },
  removeItem(key) {
    removeLocalStorageItem(key)
  },
}

function withTimeout(promise, timeoutMs, message) {
  if (!timeoutMs) return promise

  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

export const supabase = hasSupabaseConfig()
  ? createClient(mobileConfig.supabaseUrl, mobileConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: mobileAuthStorage,
        storageKey: authStorageKey,
        lockAcquireTimeout: 2500,
      },
      global: {
        headers: { 'x-client-name': 'efc-mobile-app' },
      },
    })
  : null

export async function getStoredSession({ timeoutMs = defaultSessionTimeoutMs } = {}) {
  if (!supabase) return null

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      timeoutMs,
      'Stored session lookup timed out.'
    )

    if (error) {
      console.warn('Unable to read stored session', error)
      return null
    }

    return data?.session || null
  } catch (error) {
    console.warn('Unable to read stored session', error)
    return null
  }
}

export async function getAccessToken() {
  const session = await getStoredSession()
  return session?.access_token || null
}
