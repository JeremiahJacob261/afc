export const DEFAULT_MEMBERSHIP_BALANCE_THRESHOLD = 1000

export function normalizeMembershipBalanceThreshold(value) {
  const threshold = Number(value)
  if (!Number.isFinite(threshold) || threshold < 0) {
    const error = new Error('Active-member balance threshold must be zero or greater')
    error.statusCode = 400
    throw error
  }

  return Number(threshold.toFixed(3))
}

export function isActiveMember(balance, threshold = DEFAULT_MEMBERSHIP_BALANCE_THRESHOLD) {
  const currentBalance = Number(balance || 0)
  const minimumBalance = normalizeMembershipBalanceThreshold(threshold)
  return Number.isFinite(currentBalance) && currentBalance >= minimumBalance
}
