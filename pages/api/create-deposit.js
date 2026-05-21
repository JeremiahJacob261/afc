import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { amount, method, address, adminaddress } = req.body || {}
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !method || !address) {
      return res.status(400).json({ status: 'error', message: 'Invalid deposit details' })
    }

    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const { error } = await supabase
      .from('notification')
      .insert({
        username: profile.username,
        amount: numericAmount,
        type: 'deposit',
        method,
        address,
        adminaddress,
      })

    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    return sendApiError(res, error)
  }
}
