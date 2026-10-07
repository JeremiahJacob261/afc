export const PENDING_PAYMENT_MESSAGE = 'You already have a pending deposit or withdrawal request. Please wait for it to be processed before submitting another.'

export function isPendingPaymentConflict(error) {
  return error?.code === '23505' && String(error?.message || '').includes('one_pending_payment_request_per_user')
}

export async function getPendingPaymentRequest(supabase, username) {
  const { data, error } = await supabase
    .from('notification')
    .select('id,type,sent')
    .eq('username', username)
    .in('type', ['deposit', 'withdraw', 'withdrawer'])
    .in('sent', ['pending', 'processing'])
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}
