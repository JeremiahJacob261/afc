export const vipDepositLimits = {
  1: 50,
  2: 100,
  3: 200,
  4: 300,
  5: 500,
  6: 1000,
  7: 5000,
}

export const vipReferralLimits = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 30,
  6: 40,
  7: 500,
}

export function calculateVipLevel(totald = 0, referralCount = 0) {
  if (totald >= 5000 || referralCount >= 500) return 7
  if (totald >= 1000 || referralCount >= 40) return 6
  if (totald >= 500 || referralCount >= 30) return 5
  if (totald >= 300 || referralCount >= 20) return 4
  if (totald >= 200 || referralCount >= 15) return 3
  if (totald >= 100 || referralCount >= 10) return 2
  return 1
}

export function calculateVipProgress(totald = 0, referralCount = 0, level) {
  const viplevel = level || calculateVipLevel(totald, referralCount)
  const depositLimit = vipDepositLimits[viplevel] || vipDepositLimits[1]
  const referralLimit = vipReferralLimits[viplevel] || vipReferralLimits[1]
  const depositProgress = Math.min((Number(totald || 0) / depositLimit) * 100, 100)
  const referralProgress = Math.min((Number(referralCount || 0) / referralLimit) * 100, 100)

  return {
    viplevel,
    depositProgress,
    referralProgress,
    totalProgress: (depositProgress + referralProgress) / 2,
    depositLimit,
    referralLimit,
  }
}
