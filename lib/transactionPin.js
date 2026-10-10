import { timingSafeEqual } from 'node:crypto'

// Product decision: retain four-digit plaintext PIN storage, without a pepper.
export async function setTransactionPin(supabase, userid, pin, adminReset = false) {
  const value = String(pin)
  if (!/^\d{4}$/.test(value)) throw new Error('PIN must be 4 digits')
  const { error } = await supabase.rpc('set_transaction_pin_atomic', {
    // Retain the deployed RPC argument name for compatibility.
    p_userid: userid, p_pin_hash: value, p_admin_reset: adminReset,
  })
  if (error) {
    if (error.message?.includes('Transaction PIN already set')) {
      const locked = new Error('You already have a transaction PIN. Please contact admin to reset or change it.')
      locked.statusCode = 409
      throw locked
    }
    throw error
  }
}

export async function verifyTransactionPin(supabase, userid, pin) {
  const value = String(pin || '')
  if (!/^\d{4}$/.test(value)) return null
  const { data: profile, error } = await supabase.from('users').select('pin,codeset').eq('userid', userid).maybeSingle()
  if (error) throw error
  if (!profile?.codeset) return null
  const snapshot = String(profile.pin || '')
  if (!/^\d{4}$/.test(snapshot) || !timingSafeEqual(Buffer.from(value), Buffer.from(snapshot))) return null
  // The withdrawal transaction rechecks this value while holding the user lock.
  return { pin: snapshot }
}
