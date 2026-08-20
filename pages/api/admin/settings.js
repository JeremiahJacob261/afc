import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getFirstDepositBonusPercent,
  getMembershipBalanceThreshold,
  getPlatformLinks,
  getWithdrawalSettings,
  saveFirstDepositBonusPercent,
  saveMembershipBalanceThreshold,
  savePlatformLinks,
  saveWithdrawalSettings,
} from '@/lib/adminSettings'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const [firstDepositBonusPercent, membershipBalanceThreshold, withdrawalSettings, platformLinks] = await Promise.all([
        getFirstDepositBonusPercent(supabase, {
          allowDefaultOnMissingTable: true,
        }),
        getMembershipBalanceThreshold(supabase, {
          allowDefaultOnMissingTable: true,
        }),
        getWithdrawalSettings(supabase, {
          allowDefaultOnMissingTable: true,
        }),
        getPlatformLinks(supabase, { allowDefaultOnMissingTable: true }),
      ])

      return res.status(200).json({
        status: 'success',
        settings: {
          firstDepositBonusPercent,
          membershipBalanceThreshold,
          ...withdrawalSettings,
          ...platformLinks,
        },
      })
    }

    if (req.method === 'PUT') {
      const payload = req.body || {}
      const [firstDepositBonusPercent, membershipBalanceThreshold, currentWithdrawalSettings, currentPlatformLinks] = await Promise.all([
        getFirstDepositBonusPercent(supabase, { allowDefaultOnMissingTable: true }),
        getMembershipBalanceThreshold(supabase, { allowDefaultOnMissingTable: true }),
        getWithdrawalSettings(supabase, { allowDefaultOnMissingTable: true }),
        getPlatformLinks(supabase, { allowDefaultOnMissingTable: true }),
      ])

      const nextBonusPercent = await saveFirstDepositBonusPercent(
        supabase,
        payload.firstDepositBonusPercent ?? firstDepositBonusPercent
      )
      const nextMembershipBalanceThreshold = await saveMembershipBalanceThreshold(
        supabase,
        payload.membershipBalanceThreshold ?? membershipBalanceThreshold
      )
      const nextWithdrawalSettings = await saveWithdrawalSettings(supabase, {
        minWithdrawalAmount: payload.minWithdrawalAmount ?? currentWithdrawalSettings.minWithdrawalAmount,
        annualWithdrawalLimit: payload.annualWithdrawalLimit ?? payload.maxWithdrawalAmount ?? currentWithdrawalSettings.annualWithdrawalLimit,
        dailyWithdrawalLimit: payload.dailyWithdrawalLimit ?? currentWithdrawalSettings.dailyWithdrawalLimit,
        withdrawalLimitExemptUsernames: payload.withdrawalLimitExemptUsernames ?? currentWithdrawalSettings.withdrawalLimitExemptUsernames,
        withdrawalFeePercent: payload.withdrawalFeePercent ?? currentWithdrawalSettings.withdrawalFeePercent,
        withdrawalsEnabled: payload.withdrawalsEnabled ?? currentWithdrawalSettings.withdrawalsEnabled,
        withdrawalDisabledMessage: payload.withdrawalDisabledMessage ?? currentWithdrawalSettings.withdrawalDisabledMessage,
      })
      const nextPlatformLinks = await savePlatformLinks(supabase, {
        telegramGroupUrl: payload.telegramGroupUrl ?? currentPlatformLinks.telegramGroupUrl,
        whatsappGroupUrl: payload.whatsappGroupUrl ?? currentPlatformLinks.whatsappGroupUrl,
        customerSupportUrl: payload.customerSupportUrl ?? currentPlatformLinks.customerSupportUrl,
      })

      return res.status(200).json({
        status: 'success',
        settings: {
          firstDepositBonusPercent: nextBonusPercent,
          membershipBalanceThreshold: nextMembershipBalanceThreshold,
          ...nextWithdrawalSettings,
          ...nextPlatformLinks,
        },
      })
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin settings error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
