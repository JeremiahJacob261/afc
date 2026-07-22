export const vipDepositLimits = {
  1: 6000,
  2: 12000,
  3: 30000,
  4: 60000,
  5: 120000,
  6: 180000,
  7: 300000,
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
  if (totald >= 300000 && referralCount >= 20) return 7
  if (totald >= 180000 && referralCount >= 15) return 6
  if (totald >= 120000 && referralCount >= 12) return 5
  if (totald >= 60000 && referralCount >= 8) return 4
  if (totald >= 30000 && referralCount >= 5) return 3
  if (totald >= 12000 && referralCount >= 3) return 2
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
