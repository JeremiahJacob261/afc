export const WITHDRAWAL_FEE_RATE = 0.07

export function calculateWithdrawalAmounts(amount, feePercent = WITHDRAWAL_FEE_RATE * 100) {
  const rawAmount = Number(amount)
  const requestedAmount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(3)) : 0
  const normalizedFeePercent = Number.isFinite(Number(feePercent)) ? Number(feePercent) : WITHDRAWAL_FEE_RATE * 100
  const feeRate = Math.max(0, Math.min(normalizedFeePercent, 100)) / 100
  const feeAmount = Number((requestedAmount * feeRate).toFixed(3))
  const totalAmount = Number((requestedAmount + feeAmount).toFixed(3))

  return {
    requestedAmount,
    feeAmount,
    totalAmount,
  }
}
