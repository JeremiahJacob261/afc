import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getWithdrawalSettings } from '@/lib/adminSettings'
import { calculateWithdrawalAmounts } from '@/lib/withdrawalFee'

const WITHDRAWAL_LIMIT_EXEMPT_USERNAMES = new Set([
  'zawnaingoo',
  'zambiabanking',
  'cfabanking',
  'mmkbanking',
  'zambiabanking',
  'algefcbank',
])
const WITHDRAWAL_HARD_LIMIT_AMOUNT = 100

function isWithdrawalLimitExempt(username) {
  if (!username) return false

  return WITHDRAWAL_LIMIT_EXEMPT_USERNAMES.has(String(username).trim().toLowerCase())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json([{ status: 'Failed', message: 'Method not allowed' }])
  }

  try {
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

    const isWithdrawalLimitExemptUser = isWithdrawalLimitExempt(profile?.username)

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

    if (!isWithdrawalLimitExemptUser && (qualifyingBets?.length || 0) <= 4) {
      return res.status(200).json([{ status: 'Failed', message: 'You have not placed up to 5 bets' }])
    }

    if (!isWithdrawalLimitExemptUser && amount < withdrawalSettings.minWithdrawalAmount) {
      return res.status(200).json([{ status: 'Failed', message: `Minimum amount to withdraw is ${withdrawalSettings.minWithdrawalAmount} USDT` }])
    }

    if (isWithdrawalLimitExemptUser && amount > WITHDRAWAL_HARD_LIMIT_AMOUNT) {
      return res.status(200).json([{ status: 'Failed', message: `Maximum amount to withdraw is ${WITHDRAWAL_HARD_LIMIT_AMOUNT} USDT` }])
    }

    if (!isWithdrawalLimitExemptUser && amount > withdrawalSettings.maxWithdrawalAmount) {
      return res.status(200).json([{ status: 'Failed', message: `Maximum amount to withdraw is ${withdrawalSettings.maxWithdrawalAmount} USDT` }])
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
      if (/Insufficient funds/i.test(withdrawError.message || '')) {
        return res.status(200).json([{ status: 'Failed', message: 'Insufficient funds' }])
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
