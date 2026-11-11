import { RATES } from './withdrawalCurrencyLimits.cjs'
import { getCurrentUser } from './apiAuth'
import { getSupabaseAdmin } from './supabaseAdmin'
import { timedRpc } from './apiTiming'
import { normalizeWithdrawalSettings } from './adminSettings'
import { normalizeCurrencySettings } from './currency'

export async function readPaymentState(req) {
  const user = await getCurrentUser(req)
  const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'read_payment_state', { p_userid: user.id })
  if (error) {
    if (error.message === 'Profile not found') error.statusCode = 404
    throw error
  }
  const settings = normalizeWithdrawalSettings(data.settings || {})
  const code = data.profile?.currency_code || 'USDT'
  const limits = settings.currencyLimits?.[code]
  if (limits && RATES[code]) {
    const toMmk = value => Number(value) * RATES.MMK / RATES[code]
    settings.minWithdrawalAmount = toMmk(limits.minimum)
    settings.maxWithdrawalAmount = toMmk(limits.perRequest)
    settings.dailyWithdrawalLimit = toMmk(limits.daily)
    settings.annualWithdrawalLimit = toMmk(limits.annual)
  }
  delete settings.currencyLimits
  return { status: 'success', ...data, settings, currency: normalizeCurrencySettings() }
}
