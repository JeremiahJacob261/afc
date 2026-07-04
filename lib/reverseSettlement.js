import { notifyBetSettlements } from './pushNotifications'

const SCORE_MARKETS = {
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

const LABEL_TO_KEY = Object.entries(SCORE_MARKETS).reduce((acc, [key, label]) => {
  acc[label] = key
  return acc
}, {})

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function toScoreNumber(value, label) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw createHttpError(400, `Invalid ${label} score`)
  }
  return number
}

export function getActualScoreMarket(homeScore, awayScore) {
  const home = toScoreNumber(homeScore, 'home')
  const away = toScoreNumber(awayScore, 'away')

  if (home > 3 || away > 3) {
    return { key: 'otherscores', label: SCORE_MARKETS.otherscores }
  }

  const label = `${home} - ${away}`
  const key = LABEL_TO_KEY[label]
  if (!key) {
    throw createHttpError(400, 'Unsupported score market')
  }

  return { key, label }
}

function getSettlementRpcStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('Match not found')) return 404
  if (
    message.includes('Invalid score')
    || message.includes('Unsupported score market')
    || message.includes('Missing match id')
    || message.includes('missing a supported protected market')
    || message.includes('Unsupported placed market')
  ) {
    return 400
  }

  return error?.statusCode || 500
}

export async function settleReverseMatch({ supabase, matchid, home, away }) {
  const actualMarket = getActualScoreMarket(home, away)
  const { data, error } = await supabase.rpc('settle_reverse_match_atomic', {
    p_match_id: matchid,
    p_home_score: Number(home),
    p_away_score: Number(away),
  })

  if (error) {
    throw createHttpError(getSettlementRpcStatus(error), error.message || 'Unable to settle match')
  }

  const result = data || {
    status: 'success',
    matchId: matchid,
    result: actualMarket.label,
    resultKey: actualMarket.key,
    summary: { won: 0, lost: 0, refunded: 0, total: 0 },
  }

  if (!result.alreadySettled) {
    try {
      await notifyBetSettlements(supabase, result)
    } catch (pushError) {
      console.warn('Bet settlement push notifications failed:', pushError)
    }
  }

  return result
}

export { SCORE_MARKETS }
