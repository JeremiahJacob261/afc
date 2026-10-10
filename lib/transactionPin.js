import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const deriveKey = promisify(scrypt)
const HASH_PATTERN = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{64})$/

function pinPepper() {
  const value = process.env.TRANSACTION_PIN_PEPPER || ''
  const pepper = Buffer.from(value, 'base64')
  if (pepper.length < 32) {
    const error = new Error('Transaction PIN service is unavailable')
    error.statusCode = 503
    throw error
  }
  return pepper
}

function pinInput(pin, pepper) {
  return createHmac('sha256', pepper).update(String(pin), 'utf8').digest()
}

export async function hashTransactionPin(pin) {
  if (!/^\d{4}$/.test(String(pin))) throw new Error('PIN must be 4 digits')
  const pepper = pinPepper()
  const salt = randomBytes(16)
  try {
    const result = await deriveKey(pinInput(pin, pepper), salt, 32)
    return `scrypt-v1:${salt.toString('hex')}:${result.toString('hex')}`
  } finally { pepper.fill(0) }
}

export async function setTransactionPin(supabase, userid, pin, adminReset = false) {
  const hash = await hashTransactionPin(pin)
  const { error } = await supabase.rpc('set_transaction_pin_atomic', {
    p_userid: userid, p_pin_hash: hash, p_admin_reset: adminReset,
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
  if (!/^\d{4}$/.test(String(pin || ''))) return null
  const pepper = pinPepper()
  try {
    const { data: attempt, error } = await supabase.rpc('reserve_transaction_pin_attempt', { p_userid: userid })
    if (error) throw error
    if (!attempt.allowed) {
      const limited = new Error('Too many incorrect PIN attempts. Please try again later.')
      limited.statusCode = 429
      limited.retryAt = attempt.retryAt
      throw limited
    }
    const snapshot = String(attempt.pin || '')
    const match = snapshot.match(HASH_PATTERN)
    let valid = false
    if (match) {
      const calculated = await deriveKey(pinInput(pin, pepper), Buffer.from(match[1], 'hex'), 32)
      valid = timingSafeEqual(calculated, Buffer.from(match[2], 'hex'))
    } else if (/^\d{4}$/.test(snapshot)) {
      // Existing PINs migrate only after a successful, rate-limited verification.
      valid = timingSafeEqual(Buffer.from(String(pin)), Buffer.from(snapshot))
    }
    if (!valid) return null
    const replacement = match ? null : await hashTransactionPin(pin)
    const { data: unchanged, error: finishError } = await supabase.rpc('finish_transaction_pin_attempt', {
      p_userid: userid, p_expected_pin: snapshot, p_replacement_hash: replacement,
    })
    if (finishError) throw finishError
    return unchanged ? { hash: replacement || snapshot } : null
  } finally { pepper.fill(0) }
}
