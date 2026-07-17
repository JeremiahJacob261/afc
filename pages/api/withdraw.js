import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings, WITHDRAWAL_HARD_LIMIT_AMOUNT } from '@/lib/adminSettings'
import { calculateWithdrawalAmounts } from '@/lib/withdrawalFee'

const WITHDRAWALS_ENABLED = false

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json([{ status: 'Failed', message: 'Method not allowed' }])
  }

  try {
    if (!WITHDRAWALS_ENABLED) {
      return res.status(403).json([{
        status: 'Failed',
        message: 'Withdrawal is unavailable till Monday 8pm UTC',
      }])
    }

    const body = req.body || {}
    const amount = Number(body.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json([{ status: 'Failed', message: 'Invalid amount' }])
    }

    // Parallelize initial data fetching
    const { profile, supabase } = await getCurrentProfile(
      req,
      'userid,username,codeset,pin,newrefer,balance'
    )

    // Fetch only enough bet rows to satisfy the withdrawal requirement.
    const [withdrawalSettings, { data: qualifyingBets, error: betError }] = await Promise.all([
      getWithdrawalSettings(supabase, {
        allowDefaultOnMissingTable: true,
      }),
      supabase
        .from('placed')
        .select('id')
        .eq('username', profile.username)
        .limit(5),
    ])

    if (betError) throw betError

    if ((qualifyingBets?.length || 0) <= 4) {
      return res.status(200).json([{ status: 'Failed', message: 'You have not placed up to 5 bets' }])
    }

    if (amount < withdrawalSettings.minWithdrawalAmount) {
      return res.status(200).json([{ status: 'Failed', message: `Minimum amount to withdraw is ${withdrawalSettings.minWithdrawalAmount} USDT` }])
    }

    if (amount > WITHDRAWAL_HARD_LIMIT_AMOUNT) {
      return res.status(200).json([{ status: 'Failed', message: `Maximum amount to withdraw is ${WITHDRAWAL_HARD_LIMIT_AMOUNT} USDT` }])
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

    const { error: withdrawError } = await supabase.rpc('create_withdrawal_request_atomic', {
      p_userid: profile.userid,
      p_amount: totalAmount,
      p_payout_amount: requestedAmount,
      p_wallet: body.wallet || null,
      p_method: body.method || null,
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
