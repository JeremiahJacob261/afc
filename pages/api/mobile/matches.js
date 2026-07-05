import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const MATCH_COLUMNS = [
  'id',
  'match_id',
  'home',
  'away',
  'ihome',
  'iaway',
  'league',
  'otherl',
  'date',
  'time',
  'tsgmt',
  'company',
  'comarket',
  'onenil',
  'oneone',
  'onetwo',
  'verified',
].join(',')

function exposeCompanyMarket(match) {
  if (!match) return match
  return {
    ...match,
    protectedMarket: match.comarket || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const limit = Math.min(Math.max(Number(req.query.limit || 6), 1), 50)

  try {
    const supabase = getSupabaseAdmin()
    const nowMs = Date.now()
    const { data, error } = await supabase
      .from('bets')
      .select(MATCH_COLUMNS)
      .eq('verified', false)
      .gt('tsgmt', nowMs)
      .order('tsgmt', { ascending: true })
      .limit(limit)

    if (error) throw error

    return res.status(200).json({
      status: 'success',
      matches: (data || []).map(exposeCompanyMarket),
    })
  } catch (error) {
    console.error('Unable to load mobile matches:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}
