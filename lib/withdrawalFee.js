export const WITHDRAWAL_FEE_RATE = 0.07

export function calculateWithdrawalAmounts(amount) {
  const rawAmount = Number(amount)
  const requestedAmount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(3)) : 0
  const feeAmount = Number((requestedAmount * WITHDRAWAL_FEE_RATE).toFixed(3))
  const totalAmount = Number((requestedAmount + feeAmount).toFixed(3))

  return {
    requestedAmount,
    feeAmount,
    totalAmount,
  }
}
