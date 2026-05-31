import { getCurrentProfile } from '@/lib/apiAuth'

const markets = {
  nilnil: '0 - 0',
  onenil: '1 - 0',
  nilone: '0 - 1',
  oneone: '1 - 1',
  twonil: '2 - 0',
  niltwo: '0 - 2',
  twoone: '2 - 1',
  onetwo: '1 - 2',
  twotwo: '2 - 2',
  threenil: '3 - 0',
  nilthree: '0 - 3',
  threeone: '3 - 1',
  onethree: '1 - 3',
  twothree: '2 - 3',
  threetwo: '3 - 2',
  threethree: '3 - 3',
  otherscores: 'Other',
}

function getRpcStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('Profile not found') || message.includes('Match not found')) return 404
  if (message.includes('already settled')) return 409
  if (
    message.includes('Invalid bet details')
    || message.includes('Enough USDT')
    || message.includes('maximum number of bets')
    || message.includes('expired')
    || message.includes('market is not available')
    || message.includes('Duplicate bet id')
  ) {
    return 400
  }

  return error?.statusCode || 500
}

function sendBetRpcError(res, error) {
  const status = getRpcStatus(error)
  const message = status === 500 ? 'Server error' : error.message
  return res.status(status).json({ status: 'error', message })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { match_id, picked, stake, client_bet_id } = req.body || {}
    const amount = Number(stake)

    if (!match_id || !markets[picked] || !Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ status: 'error', message: 'Invalid bet details' })
    }

    const { user, supabase } = await getCurrentProfile(req, 'userid')
    const { data, error } = await supabase.rpc('place_bet_atomic', {
      p_userid: user.id,
      p_match_id: match_id,
      p_picked: picked,
      p_stake: amount,
      p_client_bet_id: client_bet_id || null,
    })

    if (error) throw error

    return res.status(200).json(data)
  } catch (error) {
    return sendBetRpcError(res, error)
  }
}
