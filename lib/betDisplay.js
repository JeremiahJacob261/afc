import { getMatchStartMs } from './matchDisplay'

export const betNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
export function getBetOutcome(bet) {
  if (bet.settlement_outcome) return bet.settlement_outcome
  if (String(bet.won) === 'true') return 'won'
  if (String(bet.won) === 'false') return 'lost'
  return null
}
export function getBetState(bet, now = Date.now()) {
  return getBetOutcome(bet) || (getMatchStartMs(bet) > now ? 'notStarted' : 'ongoing')
}
export function getBetReturn(bet) {
  return getBetOutcome(bet) === 'refunded' ? betNumber(bet.stake) : betNumber(bet.aim) || betNumber(bet.stake) + betNumber(bet.profit)
}
export const betMoney = (value, locale) => `${betNumber(value).toLocaleString(locale, { maximumFractionDigits: 3 })} MMK`
