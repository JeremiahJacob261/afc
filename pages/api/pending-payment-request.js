import { sendApiError } from '@/lib/apiAuth'
import { readPaymentState } from '@/lib/paymentState'
import { withApiTiming } from '@/lib/apiTiming'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })

  try {
    const { pendingPaymentRequest: pending } = await readPaymentState(req)
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).json({ pending: Boolean(pending), type: pending?.type || null })
  } catch (error) {
    return sendApiError(res, error)
  }
})
