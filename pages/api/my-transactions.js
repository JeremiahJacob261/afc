import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import {
  displayPaymentCode,
  fetchPaymentMethods,
  findPaymentMethod,
  getPaymentRate,
  methodCodeFromRow,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

const allowedFilters = new Set(['all', 'deposit', 'withdraw'])
const paymentTypes = new Set(['deposit', 'withdraw', 'withdrawer'])

function amountValue(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function nullableAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function isUsdtCode(value) {
  const code = normalizePaymentCode(value)
  return code === 'usdt' || code.includes('usdt')
}

function currencyLabel(value) {
  return isUsdtCode(value) ? 'USDT' : displayPaymentCode(value || 'USDT')
}

function normalizeStatus(sent) {
  const status = String(sent ?? 'pending').trim().toLowerCase()

  if (sent === true || status === 'true' || status === 'success' || status === 'completed') return 'success'
  if (sent === false || status === 'false' || status === 'failed' || status === 'rejected') return 'failed'
  if (status === 'processing') return 'processing'
  return 'pending'
}

function statusLabel(status) {
  if (status === 'success') return 'Successful'
  if (status === 'failed') return 'Failed'
  if (status === 'processing') return 'Processing'
  return 'Pending'
}

function normalizeType(type) {
  const value = normalizePaymentCode(type)
  if (value === 'withdrawer') return 'withdraw'
  return value
}

function amountPayload(value, currency, label, options = {}) {
  return {
    value: nullableAmount(value),
    currency: currencyLabel(currency),
    label,
    approximate: options.approximate === true,
  }
}

function timestampOf(row) {
  return row.time || row.created_at || null
}

function getMethodDetails(row, methods) {
  const rawMethod = normalizePaymentCode(row.method || 'usdt')
  const savedMethod = findPaymentMethod(methods, rawMethod)
  const savedCode = savedMethod ? methodCodeFromRow(savedMethod) : ''
  const methodCode = savedCode || rawMethod || 'usdt'
  const methodCurrency = currencyLabel(methodCode)
  const methodLabel = savedMethod?.name || displayPaymentCode(row.method || methodCode)
  const rate = getPaymentRate(savedMethod, isUsdtCode(methodCode) ? 1 : 0)

  return {
    methodCode,
    methodCurrency,
    methodLabel,
    rate,
  }
}

function transactionDetail(row, type) {
  if (type === 'deposit') {
    if (row.adminaddress) return `Destination: ${row.adminaddress}`
    if (row.address) return 'Receipt uploaded'
    return 'Deposit request'
  }

  return [
    row.bank ? `Bank: ${row.bank}` : '',
    row.accountname ? `Account: ${row.accountname}` : '',
    row.address ? `Wallet: ${row.address}` : '',
  ].filter(Boolean).join(' / ') || 'Withdrawal request'
}

function normalizeTransaction(row, methods) {
  const type = normalizeType(row.type)
  const amount = amountValue(row.amount)
  const status = normalizeStatus(row.sent)
  const method = getMethodDetails(row, methods)
  const isUsdt = isUsdtCode(method.methodCode)

  let primaryAmount
  let secondaryAmount = null
  let accountingAmountUsdt = null
  let conversionNote = ''

  if (type === 'deposit') {
    primaryAmount = amountPayload(amount, method.methodCurrency, 'Submitted amount')

    if (isUsdt) {
      accountingAmountUsdt = amount
    } else if (method.rate) {
      accountingAmountUsdt = Number((amount / method.rate).toFixed(6))
      secondaryAmount = amountPayload(accountingAmountUsdt, 'USDT', 'USDT equivalent', { approximate: true })
    } else {
      conversionNote = ``;
    }
  } else {
    accountingAmountUsdt = amount

    if (isUsdt) {
      primaryAmount = amountPayload(amount, 'USDT', 'Payout amount')
      secondaryAmount = amountPayload(amount, 'USDT', 'Net after fee')
    } else if (method.rate) {
      primaryAmount = amountPayload(amount * method.rate, method.methodCurrency, 'Payout amount')
      secondaryAmount = amountPayload(amount, 'USDT', 'Net after fee')
    } else {
      primaryAmount = amountPayload(amount, 'USDT', 'Net after fee')
      conversionNote = `${method.methodCurrency} payout unavailable because rate is missing`
    }
  }

  return {
    id: String(row.id || row.uid || `${type}-${timestampOf(row)}`),
    sourceId: row.id ?? row.uid ?? null,
    type,
    legacyType: row.type || type,
    status,
    statusLabel: statusLabel(status),
    methodCode: method.methodCode,
    methodLabel: method.methodLabel,
    primaryAmount,
    secondaryAmount,
    accountingAmountUsdt,
    conversionNote,
    timestamp: timestampOf(row),
    title: type === 'deposit' ? 'Deposit' : 'Withdrawal',
    detail: transactionDetail(row, type),
  }
}

function sortTransactions(transactions) {
  return transactions.sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime()
    const bTime = new Date(b.timestamp || 0).getTime()
    if (bTime !== aTime) return bTime - aTime
    return Number(b.sourceId || 0) - Number(a.sourceId || 0)
  })
}

function matchesFilter(transaction, filter) {
  if (filter === 'all') return true
  return transaction.type === filter
}

function buildSummary(profile, transactions) {
  const totalWithdrawalsUsdt = transactions
    .filter((item) => item.type === 'withdraw' && item.status === 'success')
    .reduce((total, item) => total + amountValue(item.accountingAmountUsdt), 0)

  return {
    totalDepositsUsdt: amountValue(profile.totald),
    totalWithdrawalsUsdt: Number(totalWithdrawalsUsdt.toFixed(6)),
    count: transactions.length,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const requestedType = normalizePaymentCode(Array.isArray(req.query.type) ? req.query.type[0] : req.query.type)
    const filter = allowedFilters.has(requestedType) ? requestedType : 'all'
    const { profile, supabase } = await getCurrentProfile(req, 'username,totald')

    const [{ data, error }, methods] = await Promise.all([
      supabase
        .from('notification')
        .select('*')
        .eq('username', profile.username)
        .order('id', { ascending: false }),
      fetchPaymentMethods(supabase),
    ])

    if (error) throw error

    const allTransactions = sortTransactions((data || [])
      .filter((row) => paymentTypes.has(normalizePaymentCode(row.type)))
      .map((row) => normalizeTransaction(row, methods)))

    const transactions = allTransactions.filter((item) => matchesFilter(item, filter))
    const summary = buildSummary(profile, allTransactions)

    return res.status(200).json({
      status: 'success',
      transactions,
      data: transactions,
      summary: {
        ...summary,
        count: transactions.length,
      },
      user: {
        username: profile.username,
        totald: profile.totald,
      },
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
