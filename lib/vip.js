export const vipDepositLimits = {
  1: 50000,
  2: 100000,
  3: 250000,
  4: 500000,
  5: 1000000,
  6: 1500000,
  7: 2500000,
}

export const vipReferralLimits = {
  1: 0,
  2: 3,
  3: 5,
  4: 8,
  5: 12,
  6: 15,
  7: 20,
}

export const vipDailyRates = {
  1: 0,
  2: 0.0015,
  3: 0.003,
  4: 0.005,
  5: 0.007,
  6: 0.0095,
  7: 0.0125,
}

export function calculateVipLevel(totald = 0, referralCount = 0) {
  if (totald >= 2500000 && referralCount >= 20) return 7
  if (totald >= 1500000 && referralCount >= 15) return 6
  if (totald >= 1000000 && referralCount >= 12) return 5
  if (totald >= 500000 && referralCount >= 8) return 4
  if (totald >= 250000 && referralCount >= 5) return 3
  if (totald >= 100000 && referralCount >= 3) return 2
  return 1
}

export function calculateVipProgress(totald = 0, referralCount = 0, level) {
  const viplevel = level || calculateVipLevel(totald, referralCount)
  const depositLimit = vipDepositLimits[viplevel] || vipDepositLimits[1]
  const referralLimit = vipReferralLimits[viplevel] || vipReferralLimits[1]
  const depositProgress = Math.min((Number(totald || 0) / depositLimit) * 100, 100)
  const referralProgress = referralLimit === 0
    ? 100
    : Math.min((Number(referralCount || 0) / referralLimit) * 100, 100)

  return {
    viplevel,
    depositProgress,
    referralProgress,
    totalProgress: (depositProgress + referralProgress) / 2,
    depositLimit,
    referralLimit,
    dailyRate: vipDailyRates[viplevel] || 0,
  }
}
