import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { verifyTransactionPin } from '@/lib/transactionPin'
import { getWithdrawalSettings, WITHDRAWAL_HARD_LIMIT_AMOUNT } from '@/lib/adminSettings'
import { getWithdrawalDestination } from '@/lib/withdrawalDestination'
import { getWithdrawalEligibility, isWithdrawalLimitExempt } from '@/lib/withdrawalEligibility'
import { formatCurrency, getCurrencySettings, parseCurrency } from '@/lib/currency'
import { getPendingPaymentRequest, isPendingPaymentConflict, PENDING_PAYMENT_MESSAGE } from '@/lib/pendingPaymentRequest'
import {
  displayPaymentCurrency,
  getPaymentRate,
  isUsdtPaymentCode,
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
    const amount = parseCurrency(body.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json([{ status: 'Failed', message: 'Invalid amount' }])
    }

    const { profile, supabase } = await getCurrentProfile(
      req,
      'userid,uid,username,codeset,newrefer,balance'
    )

    const pendingRequest = await getPendingPaymentRequest(supabase, profile.username)
    if (pendingRequest) {
      return res.status(200).json([{ status: 'Failed', code: 'PAYMENT_REQUEST_PENDING', message: PENDING_PAYMENT_MESSAGE }])
    }

    const requestedMethod = normalizePaymentCode(body.method || 'usdt')
    const [withdrawalSettings, { data: latestDeposit, error: depositError }, destination] = await Promise.all([
      getWithdrawalSettings(supabase, {
        allowDefaultOnMissingTable: true,
      }),
      supabase
        .from('notification')
        .select('id,created_at')
        .eq('username', profile.username)
        .eq('type', 'deposit')
        .in('sent', SUCCESSFUL_DEPOSIT_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      getWithdrawalDestination(supabase, profile, body),
    ])

    if (depositError) throw depositError
    if (!destination) return res.status(400).json([{ status: 'Failed', message: 'Please select an available wallet linked to your account.' }])
    const savedMethod = destination.method

    let placedBetCount = 0
    if (latestDeposit?.created_at) {
      const { count, error: betError } = await supabase
        .from('placed')
        .select('id', { count: 'exact', head: true })
        .eq('username', profile.username)
        .gte('created_at', latestDeposit.created_at)

      if (betError) throw betError
      placedBetCount = count || 0
    }

    const methodCode = methodCodeFromRow(savedMethod) || requestedMethod
    const methodRate = getPaymentRate(savedMethod, isUsdtPaymentCode(methodCode) ? 1 : 0)
    if (!methodRate) {
      return res.status(400).json([{ status: 'Failed', message: 'Withdrawal method rate is unavailable. Please select another wallet.' }])
    }

    if (!withdrawalSettings.withdrawalsEnabled) {
      return res.status(200).json([{ status: 'Failed', message: withdrawalSettings.withdrawalDisabledMessage }])
    }

    if (latestDeposit && placedBetCount < BETS_REQUIRED_PER_DEPOSIT) {
      return res.status(200).json([{
        status: 'Failed',
        message: `You need to place ${BETS_REQUIRED_PER_DEPOSIT} bets after your latest successful deposit before withdrawing. You have placed ${placedBetCount}.`,
      }])
    }

    if (amount < withdrawalSettings.minWithdrawalAmount) {
      return res.status(200).json([{ status: 'Failed', message: `Minimum amount to withdraw is ${formatCurrency(withdrawalSettings.minWithdrawalAmount, currencySettings)}` }])
    }

    if (amount > WITHDRAWAL_HARD_LIMIT_AMOUNT) {
      return res.status(200).json([{ status: 'Failed', message: `Maximum amount to withdraw is ${formatCurrency(WITHDRAWAL_HARD_LIMIT_AMOUNT, currencySettings)}` }])
    }

    if (!profile.codeset) {
      return res.status(200).json([{ status: 'Failed', message: 'No transaction pin has been set' }])
    }

    const verifiedPin = await verifyTransactionPin(supabase, profile.userid, body.pass)
    if (!verifiedPin) {
      return res.status(200).json([{ status: 'Failed', message: 'Wrong password' }])
    }

    const { data: quote, error: quoteError } = await supabase.rpc('quote_withdrawal_amounts', { p_amount: amount })
    if (quoteError) throw quoteError
    const requestedAmount = quote.amount
    const totalAmount = quote.total

    const { error: withdrawError } = await supabase.rpc('create_verified_withdrawal_request_atomic', {
      p_userid: profile.userid,
      p_amount: totalAmount,
      p_payout_amount: requestedAmount,
      p_wallet_id: destination.wallet.id,
      p_method_id: savedMethod.id,
      p_pin_hash: verifiedPin.pin,
      p_wallet_snapshot: { wallet: destination.wallet.wallet, bank: destination.wallet.bank, names: destination.wallet.names },
      p_method_currency: displayPaymentCurrency(methodCode),
      p_method_rate: methodRate,
    })

    if (withdrawError) {
      const message = withdrawError.message || ''
      if (/changed|Payout wallet not found|Withdrawal method is unavailable/i.test(message)) {
        return res.status(409).json([{ status: 'Failed', message: 'Account or payment details changed. Please refresh and try again.' }])
      }
      if (/Five bets are required/i.test(message)) {
        return res.status(400).json([{ status: 'Failed', message }])
      }
      if (/pending payment request/i.test(message)) {
        return res.status(200).json([{ status: 'Failed', code: 'PAYMENT_REQUEST_PENDING', message: PENDING_PAYMENT_MESSAGE }])
      }
      if (isPendingPaymentConflict(withdrawError)) {
        return res.status(200).json([{ status: 'Failed', code: 'PAYMENT_REQUEST_PENDING', message: PENDING_PAYMENT_MESSAGE }])
      }
      if (/Insufficient funds/i.test(message)) {
        return res.status(200).json([{ status: 'Failed', message: 'Insufficient funds' }])
      }
      if (/pending|processing withdrawal request/i.test(message)) {
        const eligibility = await getWithdrawalEligibility(
          supabase,
          profile.username,
          { exempt: isWithdrawalLimitExempt(profile.username, withdrawalSettings) }
        )
        return res.status(200).json([{
          status: 'Failed',
          code: 'WITHDRAWAL_PENDING',
          message: 'Your previous withdrawal request is still pending.',
          retryAt: eligibility.retryAt,
        }])
      }
      if (/successful withdrawal.*24 hours|24 hours.*successful withdrawal/i.test(message)) {
        const eligibility = await getWithdrawalEligibility(
          supabase,
          profile.username,
          { exempt: isWithdrawalLimitExempt(profile.username, withdrawalSettings) }
        )
        return res.status(200).json([{
          status: 'Failed',
          code: 'WITHDRAWAL_COOLDOWN',
          message: 'You must wait 24 hours after your previous successful withdrawal.',
          retryAt: eligibility.retryAt,
        }])
      }
      if (/Daily withdrawal limit|Annual withdrawal limit|Maximum amount to withdraw/i.test(message)) {
        return res.status(200).json([{ status: 'Failed', message }])
      }
      throw withdrawError
    }

    return res.status(200).json([{ status: 'Success', message: 'Withdrawal Request as been sent' }])
  } catch (error) {
    if (error.statusCode) {
      if (error.retryAt) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((Date.parse(error.retryAt) - Date.now()) / 1000))))
      }
      return res.status(error.statusCode).json([{ status: 'Failed', message: error.message, ...(error.retryAt ? { retryAt: error.retryAt } : {}) }])
    }

    return sendApiError(res, error)
  }
}
