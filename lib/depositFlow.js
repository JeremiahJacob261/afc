import { getPaymentRate, isUsdtPaymentCode, toLedgerAmount } from './paymentMethods'

export const DEPOSIT_DRAFT_KEY = 'ucl.depositDraft.v1'
export const DEPOSIT_SUCCESS_KEY = 'ucl.depositSuccess.v1'

export const EMPTY_DEPOSIT_DRAFT = {
  userId: '',
  methodIdentity: '',
  transferKey: '',
  amount: '',
  destination: null,
  reviewedRate: null,
  reviewedSignature: '',
}

export const transferOptions = {
  fcfa: [{ key: 'wave', label: 'Wave', bank: 'Wave' }, { key: 'mtn', label: 'MTN Money', bank: 'MTN Money' }],
  mmk: [{ key: 'wave', label: 'Wave', bank: 'Wave' }, { key: 'kpay', label: 'KPay', bank: 'kpay' }],
  idr: [{ key: 'DANA', label: 'DANA', bank: 'DANA' }],
}

export function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

export function methodCode(method) {
  return normalizeName(method?.currency_code || method?.name)
}

export function methodIdentity(method) {
  if (!method) return ''
  const id = String(method.id ?? '').trim()
  if (id) return `id:${id}`
  const name = normalizeName(method.name)
  if (name) return `name:${name}`
  const code = methodCode(method)
  return code ? `code:${code}` : ''
}

export function methodRate(method) {
  return getPaymentRate(method, isUsdtPaymentCode(methodCode(method)) ? 1 : 0)
}

export function minimumAmount(method) {
  const rate = methodRate(method)
  return rate > 0 ? rate * 5 : null
}

export function validAmount(amount, method) {
  const minimum = minimumAmount(method)
  const number = Number(amount)
  return /^\d{1,11}(?:\.\d{1,4})?$/.test(String(amount)) && minimum !== null && Number.isFinite(number) && number >= minimum
}

export function ledgerAmount(amount, method) {
  const rate = methodRate(method)
  const number = Number(amount)
  return rate > 0 && Number.isFinite(number) ? toLedgerAmount(number, rate) : null
}

export function formatMoney(value, locale = 'en') {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return number.toLocaleString(locale, { maximumFractionDigits: 4 })
}

export function availableDestinations(destinations) {
  return (Array.isArray(destinations) ? destinations : []).filter((item) => item?.available !== false)
}

export function needsTransferOption(destinations, method) {
  const code = methodCode(method)
  if (!transferOptions[code]) return false
  const name = normalizeName(method?.name)
  return !availableDestinations(destinations).some((item) => name && normalizeName(item?.name) === name)
}

export function findDestination(destinations, method, transferKey) {
  const code = methodCode(method)
  if (!code) return null
  const list = availableDestinations(destinations)
  const name = normalizeName(method?.name)
  const named = list.find((item) => name && normalizeName(item?.name) === name)
  if (named) return named

  const matchingCurrency = list.filter((item) => normalizeName(item?.currency_code) === code)
  if (transferOptions[code]) {
    const option = transferOptions[code].find((item) => item.key === transferKey)
    if (!option) return null
    return matchingCurrency.find((item) => normalizeName(item?.bank) === normalizeName(option.bank)) || null
  }
  return matchingCurrency[0] || null
}

export function destinationSnapshot(destination) {
  if (!destination?.address) return null
  return {
    id: String(destination.id ?? ''),
    address: String(destination.address),
    accountname: String(destination.accountname || ''),
    bank: String(destination.bank || ''),
    type: String(destination.type || ''),
    image: String(destination.image || ''),
  }
}

export function isLocalDestination(destination) {
  return ['local', 'local-transfer', 'bank', 'mobile-money'].includes(normalizeName(destination?.type))
}

export function reviewSignature(draft) {
  if (!draft.methodIdentity || !draft.amount || !draft.destination?.address) return ''
  return JSON.stringify([draft.methodIdentity, draft.transferKey, draft.amount, draft.destination.address, draft.reviewedRate])
}

export function readDepositDraft(storage, userId) {
  try {
    const parsed = JSON.parse(storage.getItem(DEPOSIT_DRAFT_KEY) || 'null')
    if (!parsed || parsed.userId !== userId) return { ...EMPTY_DEPOSIT_DRAFT, userId }
    return {
      userId,
      methodIdentity: String(parsed.methodIdentity || ''),
      transferKey: String(parsed.transferKey || ''),
      amount: String(parsed.amount || ''),
      destination: parsed.destination?.address ? destinationSnapshot(parsed.destination) : null,
      reviewedRate: Number.isFinite(Number(parsed.reviewedRate)) && Number(parsed.reviewedRate) > 0 ? Number(parsed.reviewedRate) : null,
      reviewedSignature: String(parsed.reviewedSignature || ''),
    }
  } catch (_) {
    return { ...EMPTY_DEPOSIT_DRAFT, userId }
  }
}
