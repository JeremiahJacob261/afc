import { fetchPaymentMethods, isSamePaymentMethod, normalizePaymentCode } from './paymentMethods'

export async function getWithdrawalDestination(supabase, profile, body) {
  const address = String(body.wallet || '').trim()
  const ownerId = String(profile.uid || profile.userid || '').trim()
  if (!address || !ownerId) return null
  const [{ data: wallets, error }, methods] = await Promise.all([
    supabase.from('user_wallets').select('id,wallet,walletnames,bank,names')
      .eq('uid', ownerId).eq('wallet', address),
    fetchPaymentMethods(supabase, { requireAvailable: true }),
  ])
  if (error) throw error
  const requestedMethod = normalizePaymentCode(body.method || 'usdt')
  const destinations = []
  for (const wallet of wallets || []) {
    if (body.bank && String(body.bank).trim() !== String(wallet.bank || '').trim()) continue
    if (body.accountname && String(body.accountname).trim() !== String(wallet.names || '').trim()) continue
    for (const method of methods) {
      if (normalizePaymentCode(method.name) === normalizePaymentCode(wallet.walletnames) && isSamePaymentMethod(method, requestedMethod)) {
        destinations.push({ wallet, method })
      }
    }
  }
  // Do not pick an arbitrary destination when legacy data has ambiguous method names.
  return destinations.length === 1 ? destinations[0] : null
}
