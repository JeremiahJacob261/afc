import { createClient } from '@supabase/supabase-js'
import { hasSupabaseConfig, mobileConfig } from './config.js'

export const supabase = hasSupabaseConfig()
  ? createClient(mobileConfig.supabaseUrl, mobileConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'efc-mobile-auth',
      },
      global: {
        headers: { 'x-client-name': 'efc-mobile-app' },
      },
    })
  : null

export async function getStoredSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data?.session || null
}

export async function getAccessToken() {
  const session = await getStoredSession()
  return session?.access_token || null
}
