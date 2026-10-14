// Keep legacy database messages at this boundary. Clients use stable reason codes.
export function betError(error) {
  const message = String(error?.message || '')
  const reason = message.toLowerCase()
  if (error?.statusCode === 401) return { status: 401, code: 'SESSION_EXPIRED', message: 'Your session expired. Please sign in again.' }
  const reasons = [
    [/profile not found/, 404, 'PROFILE_NOT_FOUND'],
    [/match not found/, 404, 'BET_MATCH_NOT_FOUND'],
    [/already settled/, 409, 'BET_SETTLED'],
    [/odds changed/, 409, 'BET_ODDS_CHANGED'],
    [/insufficient (funds|balance)|not enough|enough\s+(mmk|usdt|fcfa)/, 400, 'BET_INSUFFICIENT_BALANCE'],
    [/maximum number of bets/, 400, 'BET_LIMIT_REACHED'],
    [/expired|betting.*closed/, 400, 'BET_CLOSED'],
    [/market is not available/, 400, 'BET_MARKET_UNAVAILABLE'],
    [/duplicate bet id/, 409, 'BET_REQUEST_CONFLICT'],
    [/invalid bet details/, 400, 'BET_INVALID_DETAILS'],
  ]
  for (const [pattern, status, code] of reasons) {
    if (pattern.test(reason)) return { status, code, message }
  }
  // A transport/backend error does not establish whether a mutation committed.
  return { status: error?.statusCode || 500, code: 'SUBMISSION_UNCONFIRMED', message: 'We could not confirm whether your bet was placed. Check My Bets before trying again.' }
}

export function sendBetError(res, error) {
  const { status, ...body } = betError(error)
  return res.status(status).json({ status: 'error', ...body })
}
