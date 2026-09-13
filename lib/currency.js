export const DEFAULT_DISPLAY_CURRENCY = 'USDT'
export const DEFAULT_DISPLAY_CURRENCY_LABEL = 'USD/USDT'

export function normalizeCurrencySettings() {
  return {
    code: DEFAULT_DISPLAY_CURRENCY,
    label: DEFAULT_DISPLAY_CURRENCY_LABEL,
  }
}

export function formatCurrency(value, _settings, locale) {
  const numericValue = Number(value || 0)
  const amount = Number.isFinite(numericValue) ? numericValue : 0
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(amount)} USDT`
}

export function parseCurrency(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Number(amount.toFixed(3)) : NaN
}

// Compatibility aliases for older pages. The platform ledger is now USDT.
export const formatFcfa = formatCurrency
export const parseFcfa = parseCurrency

export async function getCurrencySettings() {
  return normalizeCurrencySettings()
}
