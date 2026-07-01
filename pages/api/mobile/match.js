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
  'verified',
  'nilnil',
  'onenil',
  'nilone',
  'oneone',
  'twonil',
  'niltwo',
  'twoone',
  'onetwo',
  'twotwo',
  'threenil',
  'nilthree',
  'threeone',
  'onethree',
  'twothree',
  'threetwo',
  'threethree',
  'otherscores',
].join(',')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const id = String(req.query.id || '').trim()
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'Match id is required' })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('bets')
      .select(MATCH_COLUMNS)
      .eq('match_id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return res.status(404).json({ status: 'error', message: 'Match not found' })
    }

    return res.status(200).json({
      status: 'success',
      match: data,
    })
  } catch (error) {
    console.error('Unable to load mobile match:', error)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}
