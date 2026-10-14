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
  return { status: 'success', ...data, settings: normalizeWithdrawalSettings(data.settings || {}), currency: normalizeCurrencySettings() }
}
