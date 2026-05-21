import { createClient } from '@supabase/supabase-js'
import { WebSocket } from 'ws'


if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key'

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
