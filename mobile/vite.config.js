import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

function decodeJwtPayload(token) {
  try {
    const payload = String(token || '').split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'))
  } catch (error) {
    return null
  }
}

function getPublicSupabaseAnonKey(env) {
  return (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_KEY ||
    env.SUPABASE_ANON_KEY ||
    ''
  )
}

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, process.cwd(), '')
  const mobileEnv = loadEnv(mode, __dirname, '')
  const env = { ...rootEnv, ...mobileEnv }
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://europeanfc01.com'
  const updateManifestUrl =
    env.VITE_UPDATE_MANIFEST_URL || `${apiBaseUrl}/mobile-updates/android/latest.json`
  const supabaseAnonKey = getPublicSupabaseAnonKey(env)

  if (decodeJwtPayload(supabaseAnonKey)?.role === 'service_role') {
    throw new Error('Mobile auth must use a Supabase anon public key, not the service_role key.')
  }

  return {
    root: __dirname,
    publicDir: resolve(__dirname, 'public'),
    plugins: [react()],
    define: {
      __MOBILE_ENV__: JSON.stringify({
        apiBaseUrl,
        supabaseUrl: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '',
        supabaseAnonKey,
        updateManifestUrl,
        nativeVersion: env.VITE_NATIVE_VERSION || '1.0.0',
      }),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
  }
})
