export const DEFAULT_DISPLAY_CURRENCY = 'XOF'
export const DEFAULT_DISPLAY_CURRENCY_LABEL = 'FCFA'
export function normalizeCurrencySettings() {
  return {
    code: DEFAULT_DISPLAY_CURRENCY,
    label: DEFAULT_DISPLAY_CURRENCY_LABEL,
  }
}

export function formatFcfa(value, _settings, locale) {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`
}

export function parseFcfa(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount) : NaN
}

export async function getCurrencySettings() {
  return normalizeCurrencySettings()
}
