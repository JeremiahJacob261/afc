export const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function transactionError(error) {
  const message = String(error?.message || '')
  if (/pending payment request/.test(message) || error?.code === '23505' && message.includes('one_pending_payment_request_per_user')) {
    return { status: 409, code: 'PAYMENT_REQUEST_PENDING', message: 'You already have a pending deposit or withdrawal request. Please wait for it to be processed before submitting another.' }
  }
  if (/rate changed/.test(message)) return { status: 409, code: 'rate_changed', message }
  if (/Receipt upload expired/.test(message)) return { status: 409, code: 'receipt_expired', message }
  if (/fee changed|already used|changed/.test(message)) return { status: 409, message }
  if (/Profile not found/.test(message)) return { status: 404, message }
  if (error?.code === 'P0001') return { status: 400, message }
  return { status: error?.statusCode || 500, message: error?.statusCode ? message : 'Server error' }
}
