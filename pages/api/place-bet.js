import { getCurrentUser } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { formatCurrency, getCurrencySettings, parseCurrency } from '@/lib/currency'
import { sendBetError } from '@/lib/betErrors'

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

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { match_id, picked, stake, client_bet_id, expected_odd } = req.body || {}
    const user = await getCurrentUser(req)
    const supabase = getSupabaseAdmin()
    const currencySettings = await getCurrencySettings(supabase)
    const amount = parseCurrency(stake)
    const expectedOdd = Number(expected_odd)

    const reject = (code, message, details) => res.status(400).json({ status: 'error', code, message, ...(details ? { details } : {}) })
    if (!match_id) return reject('BET_INVALID_DETAILS', 'Reopen the match to load the latest bet details.')
    if (!Object.prototype.hasOwnProperty.call(markets, picked)) return reject('BET_SELECTION_REQUIRED', 'Choose an available score option before placing your bet.')
    if (!Number.isFinite(amount) || amount <= 0) return reject('BET_INVALID_STAKE', 'Enter a valid stake amount.')
    if (amount < 2500) {
      const minimum = formatCurrency(2500, currencySettings)
      return reject('BET_MINIMUM_STAKE', `Minimum stake is ${minimum}`, { minimum })
    }
    if (!Number.isFinite(expectedOdd) || expectedOdd <= 0) return reject('BET_INVALID_DETAILS', 'Reopen the match to load the latest odds.')
    if (client_bet_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(client_bet_id))) {
      return reject('BET_REQUEST_CONFLICT', 'This bet request could not be verified. Check My Bets before starting a new bet.')
    }

    // Requests with an attempt ID check a stored acceptance before current balance/expiry.
    const { data, error } = await timedRpc(req, supabase, client_bet_id ? 'place_native_bet_atomic' : 'place_bet_with_expected_odd_atomic', {
      p_userid: user.id,
      p_match_id: match_id,
      p_picked: picked,
      p_stake: amount,
      p_client_bet_id: client_bet_id || null,
      p_expected_odd: Number(expectedOdd.toFixed(3)),
    })

    if (error) throw error

    return res.status(200).json(data)
  } catch (error) {
    return sendBetError(res, error)
  }
})
