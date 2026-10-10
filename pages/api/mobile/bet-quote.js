import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { parseCurrency } from '@/lib/currency'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  if (process.env.UCL_NATIVE_BETTING_ENABLED !== 'true') return res.status(503).json({ status: 'error', message: 'Betting is unavailable' })
  try {
    const { user, supabase } = await getCurrentProfile(req, 'userid')
    const stake = parseCurrency(req.query.stake)
    if (!Number.isFinite(stake) || stake < 5000) return res.status(400).json({ status: 'error', message: 'Invalid bet details' })
    const { data, error } = await supabase.rpc('native_bet_quote', {
      p_userid: user.id,
      p_match_id: String(req.query.match_id || ''),
      p_picked: String(req.query.picked || ''),
      p_stake: stake,
    })
    if (error) {
      if (error.code === 'P0001') return res.status(400).json({ status: 'error', message: error.message })
      throw error
    }
    // Database numeric rounding and VIP/member predicates match atomic placement.
    return res.status(200).json(data)
  } catch (error) { return sendApiError(res, error) }
}
