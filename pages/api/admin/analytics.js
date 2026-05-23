import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    const { start, end } = todayRange()

    const [{ count: userCount, error: userError }, { count: betCount, error: betError }, { data: reading, error: readingError }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('placed')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
      supabase.from('reading').select('deposit,withdraw').limit(1).maybeSingle(),
    ])

    if (userError) throw userError
    if (betError) throw betError
    if (readingError) throw readingError

    return res.status(200).json({
      status: 'success',
      user: userCount || 0,
      bet: betCount || 0,
      depo: Number(reading?.deposit || 0),
      with: Number(reading?.withdraw || 0),
    })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin analytics error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
