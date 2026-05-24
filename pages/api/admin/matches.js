import { requireAdmin } from '@/lib/adminAuth'
import { ensureUpcomingMatchesCurrent } from '@/lib/apiFootballSync'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    const search = String(req.method === 'POST' ? req.body?.page || '' : req.query?.search || '').trim()
    try {
      await ensureUpcomingMatchesCurrent(supabase)
    } catch (syncError) {
      console.error('Unable to refresh upcoming matches:', syncError)
    }

    let query = supabase
      .from('upcoming_matches')
      .select('*')
      .order('timest', { ascending: true })
      .limit(250)

    if (search && Number.isNaN(Number(search))) {
      query = query.or(`home_name.ilike.%${search}%,away_name.ilike.%${search}%,league.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json(data || [])
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin matches error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
