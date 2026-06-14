import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

const MIN_WITHDRAWAL_USDT = 10

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

    if (amount < MIN_WITHDRAWAL_USDT) {
      return res.status(200).json([{ status: 'Failed', message: `Minimum amount to withdraw is ${MIN_WITHDRAWAL_USDT} USDT` }])
    }

    const { profile, supabase } = await getCurrentProfile(
      req,
      'userid,username,codeset,pin,newrefer'
    )

    const { data: bets, error: betError } = await supabase
      .from('placed')
      .select('id')
      .eq('username', profile.username)

    if (betError) throw betError

    if ((bets || []).length <= 4) {
      return res.status(200).json([{ status: 'Failed', message: 'You have not placed up to 5 bets' }])
    }

    if (!profile.codeset) {
      return res.status(200).json([{ status: 'Failed', message: 'No transaction pin has been set' }])
    }

    if (profile.pin !== body.pass) {
      return res.status(200).json([{ status: 'Failed', message: 'Wrong password' }])
    }

    const payoutAmount = Number((amount * 0.95).toFixed(3))

    const { error: withdrawError } = await supabase.rpc('create_withdrawal_request_atomic', {
      p_userid: profile.userid,
      p_amount: amount,
      p_payout_amount: payoutAmount,
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
