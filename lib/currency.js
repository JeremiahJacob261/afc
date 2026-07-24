export const DEFAULT_DISPLAY_CURRENCY = 'XOF'
export const DEFAULT_DISPLAY_CURRENCY_LABEL = 'FCFA'
export function normalizeCurrencySettings() {
  return {
    code: DEFAULT_DISPLAY_CURRENCY,
    label: DEFAULT_DISPLAY_CURRENCY_LABEL,
  }
}

export function formatFcfa(value, _settings, locale) {
  const numericValue = Number(value || 0)
  const amount = Number.isFinite(numericValue) ? Math.floor(numericValue) : 0
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`
}

export function parseFcfa(value) {
  const amount = Number(value)
  // FCFA stakes are whole amounts. Always round down so a submitted stake can
  // never exceed the balance shown to the customer.
  return Number.isFinite(amount) ? Math.floor(amount) : NaN
}

export async function getCurrencySettings() {
  return normalizeCurrencySettings()
}
