import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { getPendingPaymentRequest } from '@/lib/pendingPaymentRequest'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const pending = await getPendingPaymentRequest(supabase, profile.username)
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).json({ pending: Boolean(pending), type: pending?.type || null })
  } catch (error) {
    return sendApiError(res, error)
  }
}
