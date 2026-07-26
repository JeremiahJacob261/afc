import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings, WITHDRAWAL_HARD_LIMIT_AMOUNT } from '@/lib/adminSettings'
import { calculateWithdrawalAmounts } from '@/lib/withdrawalFee'
import { formatFcfa, getCurrencySettings, parseFcfa } from '@/lib/currency'
import {
  displayPaymentCurrency,
  getPaymentMethod,
  getPaymentRate,
  isFcfaPaymentCode,
  methodCodeFromRow,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

const BETS_REQUIRED_PER_DEPOSIT = 5
const SUCCESSFUL_DEPOSIT_STATUSES = ['success', 'true', 'completed']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json([{ status: 'Failed', message: 'Method not allowed' }])
  }

  try {
    const body = req.body || {}
    const { supabase: currencySupabase } = await getCurrentProfile(req, 'userid')
    const currencySettings = await getCurrencySettings(currencySupabase)
    const amount = parseFcfa(body.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json([{ status: 'Failed', message: 'Invalid amount' }])
    }

    // Parallelize initial data fetching
    const { profile, supabase } = await getCurrentProfile(
      req,
      'userid,username,codeset,pin,newrefer,balance'
    )

    // Every approved deposit, including historical ones, requires five placed bets.
    const requestedMethod = normalizePaymentCode(body.method || 'fcfa')
    const [withdrawalSettings, { count: placedBetCount, error: betError }, { count: successfulDepositCount, error: depositError }, savedMethod] = await Promise.all([
      getWithdrawalSettings(supabase, {
        allowDefaultOnMissingTable: true,
      }),
      supabase
        .from('placed')
        .select('id', { count: 'exact', head: true })
        .eq('username', profile.username),
      supabase
        .from('notification')
        .select('id', { count: 'exact', head: true })
        .eq('username', profile.username)
        .eq('type', 'deposit')
        .in('sent', SUCCESSFUL_DEPOSIT_STATUSES),
      getPaymentMethod(supabase, requestedMethod),
    ])

    if (betError) throw betError
    if (depositError) throw depositError

    const methodCode = methodCodeFromRow(savedMethod) || requestedMethod
    const methodRate = getPaymentRate(savedMethod, isFcfaPaymentCode(methodCode) ? 1 : 0)
    if (!methodRate) {
      return res.status(400).json([{ status: 'Failed', message: 'Withdrawal method rate is unavailable. Please select another wallet.' }])
    }

    if (!withdrawalSettings.withdrawalsEnabled) {
      return res.status(200).json([{ status: 'Failed', message: withdrawalSettings.withdrawalDisabledMessage }])
    }

    const requiredBetCount = (successfulDepositCount || 0) * BETS_REQUIRED_PER_DEPOSIT
    if ((placedBetCount || 0) < requiredBetCount) {
      return res.status(200).json([{
        status: 'Failed',
        message: `You need to place ${requiredBetCount} bets before withdrawing. You have placed ${placedBetCount || 0}.`,
      }])
    }

    if (amount < withdrawalSettings.minWithdrawalAmount) {
      return res.status(200).json([{ status: 'Failed', message: `Minimum amount to withdraw is ${formatFcfa(withdrawalSettings.minWithdrawalAmount, currencySettings)}` }])
    }

    if (amount > WITHDRAWAL_HARD_LIMIT_AMOUNT) {
      return res.status(200).json([{ status: 'Failed', message: `Maximum amount to withdraw is ${formatFcfa(WITHDRAWAL_HARD_LIMIT_AMOUNT, currencySettings)}` }])
    }

    if (!profile.codeset) {
      return res.status(200).json([{ status: 'Failed', message: 'No transaction pin has been set' }])
    }

    if (profile.pin !== body.pass) {
      return res.status(200).json([{ status: 'Failed', message: 'Wrong password' }])
    }

    const { requestedAmount, totalAmount } = calculateWithdrawalAmounts(
      amount,
      withdrawalSettings.withdrawalFeePercent
    )

    const { error: withdrawError } = await supabase.rpc('create_withdrawal_request_with_rate_snapshot_atomic', {
      p_userid: profile.userid,
      p_amount: totalAmount,
      p_payout_amount: requestedAmount,
      p_wallet: body.wallet || null,
      p_method: methodCode,
      p_method_currency: displayPaymentCurrency(methodCode),
      p_method_rate: methodRate,
      p_bank: body.bank || null,
      p_accountname: body.accountname || null,
    })

    if (withdrawError) {
      const message = withdrawError.message || ''
      if (/Insufficient funds/i.test(message)) {
        return res.status(200).json([{ status: 'Failed', message: 'Insufficient funds' }])
      }
      if (/Daily withdrawal limit|Annual withdrawal limit|Maximum amount to withdraw/i.test(message)) {
        return res.status(200).json([{ status: 'Failed', message }])
      }
      throw withdrawError
    }

    return res.status(200).json([{ status: 'Success', message: 'Withdrawal Request as been sent' }])
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json([{ status: 'Failed', message: error.message }])
    }

    return sendApiError(res, error)
  }
}
