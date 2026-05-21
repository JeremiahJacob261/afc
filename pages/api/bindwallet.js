import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'failed', message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const { profile, supabase } = await getCurrentProfile(req, 'userid')
    const type = body.type
    const wallet = body.wallet
    const name = body.name
    const walletname = body.walletname
    const bank = body.bank

    if (!wallet || !walletname) {
      return res.status(400).json({ status: 'failed', message: 'Missing wallet details' })
    }

    const { data, error: readError } = await supabase
      .from('user_wallets')
      .select('id')
      .match({ uid: profile.userid, walletnames: walletname })

    if (readError) throw readError

    if (data && data.length > 0) {
      return res.status(200).json({ status: 'failed', message: 'Wallet already linked' })
    }

    const { error } = await supabase
      .from('user_wallets')
      .insert({
        bank,
        names: name,
        wallet,
        method: type,
        uid: profile.userid,
        walletnames: walletname,
      })

    if (error) throw error

    return res.status(200).json({ status: 'success', message: 'Wallet Binding Success' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
