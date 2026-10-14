import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming } from '@/lib/apiTiming'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  if (!String(req.headers['content-type'] || '').includes('application/json')) return res.status(415).json({ message: 'JSON required' })
  try {
    let email = String(req.body?.identity || '').trim()
    const password = req.body?.password
    if (!email || email.length > 254 || typeof password !== 'string' || !password || password.length > 4096) {
      return res.status(400).json({ code: 'invalid_credentials', message: 'Invalid login credentials' })
    }
    if (!email.includes('@')) {
      const start = performance.now()
      const { data, error } = await getSupabaseAdmin().from('users').select('email').eq('username', email).maybeSingle()
      req.timings.push(['lookup', performance.now() - start])
      if (error) throw error
      if (!data?.email) return res.status(400).json({ code: 'invalid_credentials', message: 'Invalid login credentials' })
      email = data.email
    }
    const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const start = performance.now()
    const { data, error } = await auth.auth.signInWithPassword({ email, password,
      options: { captchaToken: req.body?.captchaToken } })
    req.timings.push(['auth', performance.now() - start])
    if (error) return res.status(error.status || 400).json({ code: error.code, message: error.message })
    // This shape is the Auth token endpoint contract consumed by supabase-js.
    return res.status(200).json({ ...data.session, user: data.user })
  } catch {
    return res.status(503).json({ message: 'Unable to sign in. Please try again.' })
  }
})
