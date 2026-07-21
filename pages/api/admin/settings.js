import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getFirstDepositBonusPercent,
  getWithdrawalSettings,
  saveFirstDepositBonusPercent,
  saveWithdrawalSettings,
} from '@/lib/adminSettings'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const [firstDepositBonusPercent, withdrawalSettings] = await Promise.all([
        getFirstDepositBonusPercent(supabase, {
          allowDefaultOnMissingTable: true,
        }),
        getWithdrawalSettings(supabase, {
          allowDefaultOnMissingTable: true,
        }),
      ])

      return res.status(200).json({
        status: 'success',
        settings: {
          firstDepositBonusPercent,
          ...withdrawalSettings,
        },
      })
    }

    if (req.method === 'PUT') {
      const payload = req.body || {}
      const [firstDepositBonusPercent, currentWithdrawalSettings] = await Promise.all([
        getFirstDepositBonusPercent(supabase, { allowDefaultOnMissingTable: true }),
        getWithdrawalSettings(supabase, { allowDefaultOnMissingTable: true }),
      ])

      const nextBonusPercent = await saveFirstDepositBonusPercent(
        supabase,
        payload.firstDepositBonusPercent ?? firstDepositBonusPercent
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

      return res.status(200).json({
        status: 'success',
        settings: {
          firstDepositBonusPercent: nextBonusPercent,
          ...nextWithdrawalSettings,
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
