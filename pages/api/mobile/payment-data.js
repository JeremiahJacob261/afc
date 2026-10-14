import { sendApiError } from '@/lib/apiAuth'
import { withApiTiming } from '@/lib/apiTiming'
import { readPaymentState } from '@/lib/paymentState'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  try {
    const data = await readPaymentState(req)
    const { withdrawalLimitExemptUsernames, ...settings } = data.settings
    return res.status(200).json({ ...data, settings,
      pendingPaymentRequest: data.pendingPaymentRequest ? { type: data.pendingPaymentRequest.type } : null })
  } catch (error) { return sendApiError(res, error) }
})
