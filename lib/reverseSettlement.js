import { callInternalRpc } from '@/lib/serverRpc'

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

function normalizeMarket(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  if (SCORE_MARKETS[raw]) {
    return { key: raw, label: SCORE_MARKETS[raw] }
  }

  const normalizedLabel = raw.replace(/\s*:\s*/g, ' - ')
  const key = LABEL_TO_KEY[normalizedLabel]
  if (!key) return null

  return { key, label: SCORE_MARKETS[key] }
}

async function callOptionalRpc(req, functionName, params) {
  try {
    await callInternalRpc(req, functionName, params)
  } catch (error) {
    console.error(`Optional RPC ${functionName} failed:`, error)
  }
}

async function depositRequired(req, username, amount) {
  await callInternalRpc(req, 'depositor', {
    names: username,
    amount,
  })
}

async function rewardWinner(req, supabase, bet, amountToPay) {
  await depositRequired(req, bet.username, amountToPay)

  const { data: user, error } = await supabase
    .from('users')
    .select('refer,lvla,lvlb')
    .eq('username', bet.username)
    .maybeSingle()

  if (!error && user) {
    await callOptionalRpc(req, 'affbonus', {
      name: bet.username,
      type: 'affbonus',
      amount: Number(bet.profit || 0),
      refers: user.refer,
      lvls: user.lvla,
      lvlss: user.lvlb,
    })
  }

  await supabase.from('activa').insert({
    code: 'bet',
    username: bet.username,
    amount: amountToPay,
    type: 'rebate',
  })
}

async function refundStake(req, bet) {
  await depositRequired(req, bet.username, Number(bet.stake || 0))
}

async function markBet(supabase, betid, won) {
  const { error } = await supabase
    .from('placed')
    .update({ won })
    .eq('betid', betid)

  if (error) throw error
}

export async function settleReverseMatch({ req, supabase, matchid, home, away }) {
  const actualMarket = getActualScoreMarket(home, away)

  const { data: match, error: matchError } = await supabase
    .from('bets')
    .select('*')
    .eq('match_id', matchid)
    .maybeSingle()

  if (matchError) throw matchError
  if (!match) throw createHttpError(404, 'Match not found')
  if (match.verified) throw createHttpError(409, 'Match already settled')

  const protectedMarket = match.company ? normalizeMarket(match.comarket) : null
  if (match.company && !protectedMarket) {
    throw createHttpError(400, 'Company match is missing a supported protected market')
  }

  const { data: placedBets, error: placedError } = await supabase
    .from('placed')
    .select('*')
    .eq('match_id', matchid)

  if (placedError) throw placedError

  const summary = {
    won: 0,
    lost: 0,
    refunded: 0,
    total: placedBets?.length || 0,
  }

  const settlementBets = (placedBets || []).map((bet) => {
    const selectedMarket = normalizeMarket(bet.market)
    if (!selectedMarket) {
      throw createHttpError(400, `Unsupported placed market for bet ${bet.betid}`)
    }

    return { bet, selectedMarket }
  })

  for (const { bet, selectedMarket } of settlementBets) {

    const stake = Number(bet.stake || 0)
    const profit = Number(bet.aim || 0)
    const totalReturn = stake + profit
    const selectedHappened = selectedMarket.key === actualMarket.key
    const protectedSelection = protectedMarket?.key === selectedMarket.key

    await callOptionalRpc(req, 'betterspend', { amount: stake, names: bet.username })

    if (!selectedHappened) {
      await rewardWinner(req, supabase, bet, totalReturn)
      await markBet(supabase, bet.betid, 'true')
      summary.won += 1
      continue
    }

    if (protectedSelection) {
      await refundStake(req, bet)
      await markBet(supabase, bet.betid, 'true')
      summary.refunded += 1
      continue
    }

    await markBet(supabase, bet.betid, 'false')
    summary.lost += 1
  }

  const { error: updateError } = await supabase
    .from('bets')
    .update({
      verified: true,
      results: actualMarket.label,
    })
    .eq('match_id', matchid)

  if (updateError) throw updateError

  return {
    status: 'success',
    matchId: matchid,
    result: actualMarket.label,
    resultKey: actualMarket.key,
    company: Boolean(match.company),
    protectedMarket: protectedMarket?.label || null,
    summary,
  }
}

export { SCORE_MARKETS }
