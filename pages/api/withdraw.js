import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

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

    if (amount < 5) {
      return res.status(200).json([{ status: 'Failed', message: 'Minimum amount to withdraw is 5 USDT' }])
    }

    const { profile, supabase } = await getCurrentProfile(
      req,
      'username,balance,codeset,pin,newrefer'
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

    if (Number(profile.balance || 0) < amount) {
      return res.status(200).json([{ status: 'Failed', message: 'Insufficient funds' }])
    }

    const { error: insertError } = await supabase.from('notification').insert({
      address: body.wallet,
      username: profile.username,
      amount: amount * 0.93,
      sent: 'pending',
      type: 'withdraw',
      method: body.method,
      bank: body.bank,
      accountname: body.accountname,
    })

    if (insertError) throw insertError

    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: Number(profile.balance || 0) - amount,
      })
      .eq('username', profile.username)

    if (updateError) throw updateError

    return res.status(200).json([{ status: 'Success', message: 'Withdrawal Request as been sent' }])
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json([{ status: 'Failed', message: error.message }])
    }

    return sendApiError(res, error)
  }
}
