// All stored transaction amounts use MMK; limits are configured in account currency.
const RATES = Object.freeze({ MMK: 5000, USDT: 1, FCFA: 600, ZMW: 20 })
const FIELDS = ['minimum', 'perRequest', 'daily', 'annual']

function defaultCurrencyLimits(settings) {
  const mmk = {
    minimum: Number(settings.minWithdrawalAmount),
    perRequest: Number(settings.maxWithdrawalAmount),
    daily: Number(settings.dailyWithdrawalLimit),
    annual: Number(settings.annualWithdrawalLimit),
  }
  return Object.fromEntries(Object.entries(RATES).map(([code, rate]) => [code,
    Object.fromEntries(FIELDS.map(field => [field, mmk[field] * rate / RATES.MMK]))]))
}

function validateCurrencyLimits(input) {
  const output = {}
  for (const code of Object.keys(RATES)) {
    const item = input?.[code]
    if (!item) throw new Error(`Missing withdrawal limits for ${code}`)
    const limits = {}
    for (const field of FIELDS) {
      const raw = item[field]
      if (raw === '' || raw == null || !Number.isFinite(Number(raw)) || Number(raw) < 0) {
        throw new Error(`${code} ${field} must be a non-negative number`)
      }
      limits[field] = Number(raw)
      if (limits[field] * RATES.MMK / RATES[code] >= 1e12) {
        throw new Error(`${code} ${field} is too large`)
      }
    }
    if (limits.minimum > limits.perRequest || limits.minimum > limits.daily || limits.minimum > limits.annual) {
      throw new Error(`${code} limits must be at least the minimum`)
    }
    output[code] = limits
  }
  return output
}

module.exports = { RATES, defaultCurrencyLimits, validateCurrencyLimits }
