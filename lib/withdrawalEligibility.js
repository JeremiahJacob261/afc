const WITHDRAWAL_TYPES = ['withdraw', 'withdrawer']
const PENDING_STATUSES = new Set(['pending', 'processing'])
const SUCCESS_STATUSES = new Set(['success', 'true', 'completed'])
const COOLDOWN_MS = 24 * 60 * 60 * 1000

function normalizedStatus(value, fallback = '') {
  return String(value ?? fallback).trim().toLowerCase()
}

function timestampValue(value) {
  if (!value) return Number.NaN
  const text = String(value)
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)
  const timestamp = new Date(hasTimezone ? text : `${text}Z`).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.NaN
}

export function isWithdrawalLimitExempt(username, settings = {}) {
  const normalizedUsername = String(username || '').trim().toLowerCase()
  if (!normalizedUsername) return false

  return (settings.withdrawalLimitExemptUsernames || []).some(
    (value) => String(value || '').trim().toLowerCase() === normalizedUsername
  )
}

export async function getWithdrawalEligibility(supabase, username, { exempt = false } = {}) {
  const normalizedUsername = String(username || '').trim()
  const available = {
    canWithdraw: true,
    reason: null,
    code: null,
    retryAt: null,
  }

  if (!normalizedUsername || exempt) return available

  const { data, error } = await supabase
    .from('notification')
    .select('sent,processed_at,created_at')
    .eq('username', normalizedUsername)
    .in('type', WITHDRAWAL_TYPES)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const pending = (data || []).find((row) => PENDING_STATUSES.has(normalizedStatus(row.sent, 'pending')))
  if (pending) {
    return {
      canWithdraw: false,
      reason: 'pending',
      code: 'WITHDRAWAL_PENDING',
      retryAt: null,
    }
  }

  const now = Date.now()
  const cutoff = now - COOLDOWN_MS
  const recentSuccess = (data || [])
    .filter((row) => SUCCESS_STATUSES.has(normalizedStatus(row.sent)))
    .map((row) => {
      const value = row.processed_at || row.created_at
      const timestamp = timestampValue(value)
      return { timestamp, value }
    })
    .filter((row) => Number.isFinite(row.timestamp) && row.timestamp >= cutoff)
    .sort((left, right) => right.timestamp - left.timestamp)[0]

  if (recentSuccess) {
    return {
      canWithdraw: false,
      reason: 'cooldown',
      code: 'WITHDRAWAL_COOLDOWN',
      retryAt: new Date(recentSuccess.timestamp + COOLDOWN_MS).toISOString(),
    }
  }

  return available
}
