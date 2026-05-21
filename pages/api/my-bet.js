import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { profile, supabase } = await getCurrentProfile(req, 'username')

    const { data: bet, error } = await supabase
      .from('placed')
      .select('*')
      .eq('betid', id)
      .eq('username', profile.username)
      .maybeSingle()

    if (error) throw error
    if (!bet) {
      return res.status(404).json({ status: 'error', message: 'Bet not found' })
    }

    const { data: match, error: matchError } = await supabase
      .from('bets')
      .select('*')
      .eq('match_id', bet.match_id)
      .maybeSingle()

    if (matchError) throw matchError

    return res.status(200).json({
      status: 'success',
      bet,
      match: match || {},
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
