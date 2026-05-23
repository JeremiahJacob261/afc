import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  displayPaymentCode,
  joinPaymentMethod,
  toDestinationRow,
  toWalletRow,
} from '@/lib/paymentMethods'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}

const LOGO_BUCKET = process.env.PAYMENT_METHOD_LOGO_BUCKET || 'trcreceipt/public'

function apiError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function validateMethodInput(body = {}) {
  const name = String(body.name || '').trim()
  const currencyCode = displayPaymentCode(body.currencyCode)
  const rate = Number(body.rate)
  const accountName = String(body.accountName || '').trim()
  const accountNumber = String(body.accountNumber || '').trim()

  if (!name) throw apiError('Method name is required')
  if (!currencyCode) throw apiError('Currency code is required')
  if (!Number.isFinite(rate) || rate <= 0) throw apiError('Rate must be a positive number')
  if (!accountName) throw apiError('Account holder name is required')
  if (!accountNumber) throw apiError('Account number or wallet address is required')

  return {
    ...body,
    name,
    currencyCode,
    rate,
    accountName,
    accountNumber,
  }
}

function sanitizeFileName(value) {
  return String(value || 'logo')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'logo'
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw apiError('Invalid logo upload payload')

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

async function uploadLogo(supabase, logoFile) {
  if (!logoFile?.dataUrl) return ''

  const { contentType, buffer } = parseDataUrl(logoFile.dataUrl)
  const fileName = sanitizeFileName(logoFile.name)
  const path = `payment-methods/${Date.now()}-${fileName}`
  const { error } = await supabase
    .storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: logoFile.type || contentType,
      upsert: true,
    })

  if (error) throw apiError(`Logo upload failed: ${error.message}`, 400)

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

async function getJoinedMethods(supabase) {
  const [{ data: methods, error: methodError }, { data: destinations, error: destinationError }] = await Promise.all([
    supabase.from('walle').select('*'),
    supabase.from('depositwallet').select('*'),
  ])

  if (methodError) throw methodError
  if (destinationError) throw destinationError

  return (methods || []).map((method) => joinPaymentMethod(method, destinations || []))
}

async function findSavedMethod(supabase, id, name) {
  if (id) {
    const { data, error } = await supabase
      .from('walle')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  if (!name) return null
  const { data, error } = await supabase
    .from('walle')
    .select('*')
    .eq('name', name)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function findDestination(supabase, id, name) {
  if (id) {
    const { data, error } = await supabase
      .from('depositwallet')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  if (!name) return null
  const { data, error } = await supabase
    .from('depositwallet')
    .select('*')
    .eq('name', name)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function createMethod(supabase, body) {
  const input = validateMethodInput(body)
  const image = await uploadLogo(supabase, body.logoFile) || body.logoUrl || ''

  const { data: method, error: methodError } = await supabase
    .from('walle')
    .insert(toWalletRow(input, image))
    .select('*')
    .single()

  if (methodError) throw methodError

  const currentDestination = await findDestination(supabase, body.destinationId, input.name)
  const destinationRow = toDestinationRow(input, image)
  let destination
  let destinationError

  if (currentDestination?.id) {
    const result = await supabase
      .from('depositwallet')
      .update(destinationRow)
      .eq('id', currentDestination.id)
      .select('*')
      .single()
    destination = result.data
    destinationError = result.error
  } else {
    const result = await supabase
      .from('depositwallet')
      .insert(destinationRow)
      .select('*')
      .single()
    destination = result.data
    destinationError = result.error
  }

  if (destinationError) throw destinationError

  return joinPaymentMethod(method, [destination])
}

async function updateMethod(supabase, body) {
  if (body.toggleOnly) {
    const currentMethod = await findSavedMethod(supabase, body.id, body.name)
    if (!currentMethod) throw apiError('Payment method not found', 404)

    const { data, error } = await supabase
      .from('walle')
      .update({ available: body.available !== false })
      .eq('id', currentMethod.id)
      .select('*')
      .single()

    if (error) throw error
    return joinPaymentMethod(data, [])
  }

  const input = validateMethodInput(body)
  const currentMethod = await findSavedMethod(supabase, body.id, body.previousName || input.name)
  if (!currentMethod) throw apiError('Payment method not found', 404)

  const image = await uploadLogo(supabase, body.logoFile) || body.logoUrl || currentMethod.image || ''
  const walletRow = toWalletRow(input, image)

  const { data: method, error: methodError } = await supabase
    .from('walle')
    .update(walletRow)
    .eq('id', currentMethod.id)
    .select('*')
    .single()

  if (methodError) throw methodError

  const currentDestination = await findDestination(supabase, body.destinationId, body.previousName || currentMethod.name)
  const destinationRow = toDestinationRow(input, image)

  let destination
  let destinationError
  if (currentDestination?.id) {
    const result = await supabase
      .from('depositwallet')
      .update(destinationRow)
      .eq('id', currentDestination.id)
      .select('*')
      .single()
    destination = result.data
    destinationError = result.error
  } else {
    const result = await supabase
      .from('depositwallet')
      .insert(destinationRow)
      .select('*')
      .single()
    destination = result.data
    destinationError = result.error
  }

  if (destinationError) throw destinationError

  return joinPaymentMethod(method, [destination])
}

async function deleteMethod(supabase, body) {
  const currentMethod = await findSavedMethod(supabase, body.id, body.name)
  if (!currentMethod) throw apiError('Payment method not found', 404)

  if (body.hardDelete) {
    const { error: destinationError } = await supabase
      .from('depositwallet')
      .delete()
      .eq('name', currentMethod.name)

    if (destinationError) throw destinationError

    const { error: methodError } = await supabase
      .from('walle')
      .delete()
      .eq('id', currentMethod.id)

    if (methodError) throw methodError
    return { deleted: true }
  }

  const { data, error } = await supabase
    .from('walle')
    .update({ available: false })
    .eq('id', currentMethod.id)
    .select('*')
    .single()

  if (error) throw error
  return joinPaymentMethod(data, [])
}

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const methods = await getJoinedMethods(supabase)
      return res.status(200).json({ status: 'success', methods })
    }

    if (req.method === 'POST') {
      const method = await createMethod(supabase, req.body || {})
      return res.status(201).json({ status: 'success', method })
    }

    if (req.method === 'PUT') {
      const method = await updateMethod(supabase, req.body || {})
      return res.status(200).json({ status: 'success', method })
    }

    if (req.method === 'DELETE') {
      const result = await deleteMethod(supabase, req.body || {})
      return res.status(200).json({ status: 'success', ...result })
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  } catch (error) {
    const status = error.statusCode || 500
    const detail = error.message || 'Server error'
    const message = status === 500 ? `Payment method API failed: ${detail}` : detail
    console.error('Payment method API error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
