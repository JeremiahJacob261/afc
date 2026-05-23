export function normalizePaymentCode(value) {
  return String(value || '').trim().toLowerCase()
}

export function displayPaymentCode(value) {
  return String(value || '').trim().toUpperCase()
}

export function normalizePaymentType(value) {
  return String(value || '').trim() || 'mobile-money'
}

export function getPaymentRate(method, fallback = 0) {
  const rate = Number(method?.rates ?? method?.rate)
  return Number.isFinite(rate) && rate > 0 ? rate : fallback
}

export function methodCodeFromRow(method) {
  return normalizePaymentCode(method?.currency_code || method?.name)
}

export function isSamePaymentMethod(method, codeOrName) {
  const needle = normalizePaymentCode(codeOrName)
  if (!needle) return false

  return [
    method?.currency_code,
    method?.name,
  ].some((value) => normalizePaymentCode(value) === needle)
}

export function findPaymentMethod(methods, codeOrName, { requireAvailable = false } = {}) {
  const list = Array.isArray(methods) ? methods : []
  return list.find((method) => {
    if (requireAvailable && method?.available === false) return false
    return isSamePaymentMethod(method, codeOrName)
  }) || null
}

export async function fetchPaymentMethods(supabase, { requireAvailable = false } = {}) {
  let query = supabase.from('walle').select('*')
  if (requireAvailable) query = query.eq('available', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function getPaymentMethod(supabase, codeOrName, options = {}) {
  const methods = await fetchPaymentMethods(supabase, options)
  return findPaymentMethod(methods, codeOrName, options)
}

export function joinPaymentMethod(method, destinations) {
  const destinationList = Array.isArray(destinations) ? destinations : []
  const methodName = String(method?.name || '').trim()
  const methodCode = displayPaymentCode(method?.currency_code || method?.name)

  const destination = destinationList.find((item) => (
    normalizePaymentCode(item?.name) === normalizePaymentCode(methodName)
  )) || destinationList.find((item) => (
    normalizePaymentCode(item?.currency_code) === normalizePaymentCode(methodCode)
  )) || null

  const image = method?.image || destination?.image || ''

  return {
    id: String(method?.id ?? methodName),
    methodId: method?.id ?? null,
    destinationId: destination?.id ?? null,
    name: methodName,
    currencyCode: methodCode,
    rate: String(method?.rates ?? ''),
    available: method?.available !== false,
    type: normalizePaymentType(method?.type || destination?.type),
    logoPreview: image,
    image,
    bank: destination?.bank || '',
    accountName: destination?.accountname || '',
    accountNumber: destination?.address || '',
    notes: method?.notes || '',
    destinationName: destination?.name || methodName,
  }
}

export function toWalletRow(input, image) {
  return {
    name: String(input.name || '').trim(),
    currency_code: displayPaymentCode(input.currencyCode),
    rates: Number(input.rate),
    available: input.available !== false,
    image: image || '',
    type: normalizePaymentType(input.type),
  }
}

export function toDestinationRow(input, image) {
  return {
    name: String(input.name || '').trim(),
    currency_code: displayPaymentCode(input.currencyCode),
    type: normalizePaymentType(input.type),
    bank: String(input.bank || '').trim(),
    accountname: String(input.accountName || '').trim(),
    address: String(input.accountNumber || '').trim(),
    image: image || '',
  }
}
