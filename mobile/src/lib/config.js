const injectedEnv = typeof __MOBILE_ENV__ !== 'undefined' ? __MOBILE_ENV__ : {}

export const mobileConfig = {
  apiBaseUrl: injectedEnv.apiBaseUrl || 'https://www.europeanfc01.com',
  supabaseUrl: injectedEnv.supabaseUrl || '',
  supabaseAnonKey: injectedEnv.supabaseAnonKey || '',
  updateManifestUrl:
    injectedEnv.updateManifestUrl ||
    'https://www.europeanfc01.com/mobile-updates/android/latest.json',
  nativeVersion: injectedEnv.nativeVersion || '1.0.1',
}

export function hasSupabaseConfig() {
  return Boolean(mobileConfig.supabaseUrl && mobileConfig.supabaseAnonKey)
}
