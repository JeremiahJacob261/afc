import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const { userId, password } = req.body || {}

    if (!userId || !password || String(password).length < 6) {
      return res.status(400).json({ status: 'error', message: 'A valid user id and password are required' })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.updateUserById(userId, { password })
    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin auth password error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
