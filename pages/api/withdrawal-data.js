import { sendApiError } from '@/lib/apiAuth'
import { withApiTiming } from '@/lib/apiTiming'
import { readPaymentState } from '@/lib/paymentState'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  try { return res.status(200).json(await readPaymentState(req)) }
  catch (error) { return sendApiError(res, error) }
})
