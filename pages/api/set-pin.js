import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming } from '@/lib/apiTiming'
import { setTransactionPin } from '@/lib/transactionPin'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { pin } = req.body || {}
    if (!/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ status: 'error', message: 'Pin must be 4 digits' })
    }

    const user = await getCurrentUser(req)
    await setTransactionPin(getSupabaseAdmin(), user.id, String(pin))

    return res.status(200).json({ status: 'success', message: 'You have successfully set a new Pin' })
  } catch (error) {
    return sendApiError(res, error)
  }
})
