import { createClient } from '@supabase/supabase-js'
import { WebSocket } from 'ws'


if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-anon-key'

function decodeJwtPayload(token) {
  try {
    const payload = String(token || '').split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = typeof window === 'undefined'
      ? Buffer.from(normalized, 'base64').toString('utf8')
      : window.atob(normalized)

    return JSON.parse(json)
  } catch (error) {
    return null
  }
}

const supabaseKeyPayload = decodeJwtPayload(supabaseKey)
if (supabaseKeyPayload?.role === 'service_role') {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the Supabase anon public key, not the service_role key.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
  
})

export default function handler(req, res) {
  return res.status(404).json({ status: 'error', message: 'Not found' })
}
