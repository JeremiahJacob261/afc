import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    const find = String(req.method === 'POST' ? req.body?.find || '' : req.query?.find || '').trim()

    let query = supabase
      .from('notification')
      .select('*')
      .neq('address', 'admin')
      .order('id', { ascending: false })
      .limit(150)

    if (find) {
      query = query.ilike('username', `%${find}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json(data || [])
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin finances error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
