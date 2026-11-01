// Account currency policy. Rates are units of currency per 1 USDT.
// Keep ledger conversions explicit: existing balances are denominated in MMK.
export const CURRENCY_RATES = Object.freeze({ USDT: 1, MMK: 5000, FCFA: 600, ZMW: 20 })
export const ACCOUNT_CURRENCY_ROUTES = ['/api/me', '/api/my-bets', '/api/my-bet', '/api/my-referrals', '/api/my-transactions', '/api/notify', '/api/place-bet', '/api/withdraw', '/api/withdrawal-data', '/api/wheel-spin', '/api/mobile/payment-data', '/api/mobile/bet-quote', '/api/mobile/withdrawal-quote', '/api/mobile/deposit-quote']

const FCFA_COUNTRIES = new Set(['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG', 'CM', 'CF', 'TD', 'CG', 'GQ', 'GA'])
const SPECIAL_DIAL_CODES = { '+95': 'MM', '+260': 'ZM', '+229': 'BJ', '+226': 'BF', '+225': 'CI', '+245': 'GW', '+223': 'ML', '+227': 'NE', '+221': 'SN', '+228': 'TG', '+237': 'CM', '+236': 'CF', '+235': 'TD', '+242': 'CG', '+240': 'GQ', '+241': 'GA' }

export function accountCurrency(profile = {}) {
  if (Object.hasOwn(CURRENCY_RATES, profile.currency_code)) return profile.currency_code
  return currencyForCountry(profile.country_iso || SPECIAL_DIAL_CODES[profile.countrycode] || profile.countrycode)
}

export function currencyForCountry(countryCode) {
  const code = String(countryCode || '').trim().toUpperCase()
  if (code === 'MM') return 'MMK'
  if (code === 'ZM') return 'ZMW'
  if (FCFA_COUNTRIES.has(code)) return 'FCFA'
  return 'USDT'
}

export function convertCurrency(amount, from, to) {
  const sourceRate = CURRENCY_RATES[String(from || '').toUpperCase()]
  const targetRate = CURRENCY_RATES[String(to || '').toUpperCase()]
  const value = Number(amount)
  if (!Number.isFinite(value) || !sourceRate || !targetRate) return null
  return value / sourceRate * targetRate
}

export function formatLedgerText(text, code) {
  return text.replace(/(-?\d[\d,]*(?:\.\d+)?)\s+MMK\b/g, (_, amount) => `${Number(convertCurrency(Number(amount.replaceAll(',', '')), 'MMK', code).toFixed(6)).toLocaleString('en', { maximumFractionDigits: 6 })} ${code}`).replace(/\bMMK\b/g, code)
}

