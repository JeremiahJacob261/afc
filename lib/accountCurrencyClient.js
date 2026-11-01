import { CURRENCY_RATES, ACCOUNT_CURRENCY_ROUTES } from './currencyPolicy.js'
// This module is client-side only. Server accounting remains MMK.
let code = 'USDT'
export function accountCurrencyCode() { return code }
export function accountUnitsPerUsdt() { return CURRENCY_RATES[code] }
export function accountAmountFromMmk(value) { return Number(value || 0) / 5000 * accountUnitsPerUsdt() }
export function setAccountCurrency(currency) {
  const next = typeof currency === 'string' ? currency : currency?.code
  if (Object.hasOwn(CURRENCY_RATES, next)) code = next
}
export function readAccountCurrency(payload) {
  const item = Array.isArray(payload) ? payload[0] : payload
  if (item?.currency?.contract !== 1 || !Object.hasOwn(CURRENCY_RATES, item.currency.code)) return false
  setAccountCurrency(item.currency)
  return true
}
export function needsAccountCurrency(path) { return ACCOUNT_CURRENCY_ROUTES.includes(String(path).split('?')[0]) }
export function accountMoney(value, locale) {
  return `${Number(value || 0).toLocaleString(locale, { maximumFractionDigits: 6 })} ${code}`
}

export const accountCurrencyPostProcessor = {
  type: 'postProcessor', name: 'accountCurrency',
  process(value, keys, options = {}) {
    // A supplied payment currency is independent of the account currency.
    if (options.currency || options.method) return value
    const key = Array.isArray(keys) ? keys[0] : keys
    if (key === 'messages.stakeMinimum') value = value.replace('2,500', String(accountAmountFromMmk(2500)))
    if (key === 'mobile.match.insufficientBalance') value = value.replace(/FCFA/g, code)
    if (String(key).startsWith('landing.')) value = value.replace(/(\d[\d,]*(?:\.\d+)?)\s+FCFA\b/g, (_, amount) => `${(Number(amount.replaceAll(',', '')) / 600 * accountUnitsPerUsdt()).toLocaleString('en', { maximumFractionDigits: 6 })} ${code}`).replace(/\bFCFA\b/g, code)
    return value.replace(/\bMMK\b/g, code)
  },
}
