import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

function clean(value) {
  return String(value || '').trim()
}

function isLocalMethod(type) {
  return ['local', 'local-transfer', 'bank', 'mobile-money'].includes(clean(type).toLowerCase())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'failed', message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const { profile, supabase } = await getCurrentProfile(req, 'userid')
    const methodId = clean(body.methodId)
    const legacyWalletName = clean(body.walletname)
    const wallet = clean(body.wallet)
    const name = clean(body.name)
    const bank = clean(body.bank)

    if (!wallet || (!methodId && !legacyWalletName)) {
      return res.status(400).json({ status: 'failed', message: 'Missing wallet details' })
    }

    let methodQuery = supabase.from('walle').select('*').eq('available', true)
    methodQuery = methodId
      ? methodQuery.eq('id', methodId)
      : methodQuery.eq('name', legacyWalletName)

    const { data: paymentMethod, error: methodError } = await methodQuery.maybeSingle()

    if (methodError) throw methodError

    if (!paymentMethod) {
      return res.status(400).json({ status: 'failed', message: 'Payment method is not available' })
    }

    const type = clean(paymentMethod.type)
    const walletname = clean(paymentMethod.name)
    const isLocal = isLocalMethod(type)

    if (isLocal && (!name || !bank)) {
      return res.status(400).json({ status: 'failed', message: 'Missing bank account details' })
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
        bank: isLocal ? bank : walletname,
        names: isLocal ? name : '',
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
