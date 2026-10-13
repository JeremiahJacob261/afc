import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { applyCursor, cursorPage, decodeCursor, encodeCursor, pageSize } from '@/lib/pagination'
import {
  displayPaymentCurrency,
  fetchPaymentMethods,
  findPaymentMethod,
  fromLedgerAmount,
  getPaymentRate,
  isUsdtPaymentCode,
  methodCodeFromRow,
  normalizePaymentCode,
  toLedgerAmount,
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

function statusKey(status) {
  if (status === 'success') return 'status.success'
  if (status === 'failed') return 'status.failed'
  if (status === 'processing') return 'status.processing'
  return 'status.pending'
}

function normalizeType(type) {
  const value = normalizePaymentCode(type)
  if (value === 'withdrawer') return 'withdraw'
  return value
}

function amountPayload(value, currency, label, options = {}) {
  return {
    value: nullableAmount(value),
    currency: displayPaymentCurrency(currency),
    label,
    labelKey: options.labelKey || '',
    approximate: options.approximate === true,
  }
}

function timestampOf(row) {
  return row.time || row.created_at || null
}

function getMethodDetails(row, methods) {
  const rawMethod = normalizePaymentCode(row.method_currency || row.method || 'usdt')
  const savedMethod = findPaymentMethod(methods, rawMethod)
  const savedCode = savedMethod ? methodCodeFromRow(savedMethod) : ''
  const methodCode = normalizePaymentCode(row.method_currency) || savedCode || rawMethod || 'usdt'
  const methodCurrency = displayPaymentCurrency(methodCode)
  const methodLabel = savedMethod?.name || displayPaymentCurrency(row.method_currency || row.method || methodCode)
  const snapshotRate = Number(row.method_rate)
  const rate = Number.isFinite(snapshotRate) && snapshotRate > 0
    ? snapshotRate
    : getPaymentRate(savedMethod, isUsdtPaymentCode(methodCode) ? 1 : 0)

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

function transactionDetailMeta(row, type) {
  if (type === 'deposit') {
    if (row.adminaddress) {
      return {
        detailKey: 'mobile.transactions.destinationDetail',
        detailValues: { destination: row.adminaddress },
      }
    }

    if (row.address) return { detailKey: 'mobile.transactions.receiptUploaded', detailValues: {} }
    return { detailKey: 'mobile.transactions.depositRequest', detailValues: {} }
  }

  const detailParts = [
    row.bank ? { labelKey: 'forms.bank', value: row.bank } : null,
    row.accountname ? { labelKey: 'forms.accountName', value: row.accountname } : null,
    row.address ? { labelKey: 'forms.walletAddress', value: row.address } : null,
  ].filter(Boolean)

  if (detailParts.length) {
    return {
      detailKey: '',
      detailValues: {},
      detailParts,
    }
  }

  return { detailKey: 'mobile.transactions.withdrawalRequest', detailValues: {}, detailParts: [] }
}

function shouldHideStatusTag(row, type, status) {
  return type === 'deposit'
    && status === 'pending'
    && String(row.method || '').trim().length > 6
}

function normalizeTransaction(row, methods) {
  const type = normalizeType(row.type)
  const amount = amountValue(row.amount)
  const status = normalizeStatus(row.sent)
  const method = getMethodDetails(row, methods)
  const isUsdt = isUsdtPaymentCode(method.methodCode)

  let primaryAmount
  let secondaryAmount = null
  let accountingAmountMmk = null
  let conversionNote = ''
  let conversionNoteKey = ''
  let conversionNoteValues = {}

  if (type === 'deposit') {
    primaryAmount = amountPayload(amount, method.methodCurrency, 'Submitted amount', { labelKey: 'mobile.transactions.submittedAmount' })

    if (method.rate) {
      accountingAmountMmk = Number(toLedgerAmount(amount, method.rate).toFixed(3))
      secondaryAmount = amountPayload(accountingAmountMmk, 'MMK', 'MMK equivalent', { approximate: true })
    } else {
      conversionNote = `${method.methodCurrency} conversion unavailable because rate is missing`
      conversionNoteKey = 'mobile.transactions.methodMissingRate'
      conversionNoteValues = { currency: method.methodCurrency }
    }
  } else {
    accountingAmountMmk = amount

    if (isUsdt) {
      primaryAmount = amountPayload(fromLedgerAmount(amount, method.rate), 'USDT', 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
      secondaryAmount = amountPayload(amount, 'MMK', 'MMK amount')
    } else if (method.rate) {
      primaryAmount = amountPayload(fromLedgerAmount(amount, method.rate), method.methodCurrency, 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
      secondaryAmount = amountPayload(amount, 'MMK', 'MMK amount')
    } else {
      primaryAmount = amountPayload(amount, 'MMK', 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
      conversionNote = `${method.methodCurrency} payout unavailable because rate is missing`
      conversionNoteKey = 'mobile.transactions.methodMissingRate'
      conversionNoteValues = { currency: method.methodCurrency }
    }
  }

  const detailMeta = transactionDetailMeta(row, type)

  return {
    id: String(row.id || row.uid || `${type}-${timestampOf(row)}`),
    sourceId: row.id ?? row.uid ?? null,
    type,
    legacyType: row.type || type,
    status,
    statusLabel: statusLabel(status),
    statusKey: statusKey(status),
    hideStatusTag: shouldHideStatusTag(row, type, status),
    methodCode: method.methodCode,
    methodLabel: method.methodLabel,
    primaryAmount,
    secondaryAmount,
    accountingAmountMmk,
    conversionNote,
    conversionNoteKey,
    conversionNoteValues,
    timestamp: timestampOf(row),
    title: type === 'deposit' ? 'Deposit' : 'Withdrawal',
    titleKey: type === 'deposit' ? 'mobile.transactions.titleDeposit' : 'mobile.transactions.titleWithdrawal',
    detail: transactionDetail(row, type),
    ...detailMeta,
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
  const totalWithdrawalsMmk = transactions
    .filter((item) => item.type === 'withdraw' && item.status === 'success')
    .reduce((total, item) => total + amountValue(item.accountingAmountMmk), 0)

  return {
    totalDepositsMmk: amountValue(profile.totald),
    totalWithdrawalsMmk: Number(totalWithdrawalsMmk.toFixed(3)),
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
    res.setHeader('Cache-Control', 'private, no-store')
    const paged = req.query?.page === '1'
    const limit = pageSize(req.query?.limit)
    const cursor = decodeCursor(req.query?.cursor)
    const { profile, supabase } = await getCurrentProfile(req, 'username,totald,totalw')
    let query = supabase.from('notification').select('*', { count: paged ? 'exact' : undefined }).eq('username', profile.username).in('type', ['deposit', 'withdraw', 'withdrawer'])
    if (filter !== 'all') query = query.in('type', filter === 'withdraw' ? ['withdraw', 'withdrawer'] : ['deposit'])

    const [result, methods] = await Promise.all([
      paged ? applyCursor(query, cursor, 'transactions', limit) : query.order('id', { ascending: false }),
      fetchPaymentMethods(supabase),
    ])

    if (result.error) throw result.error
    const page = paged ? cursorPage(result.data || [], limit) : { data: result.data || [] }
    const data = page.data

    const allTransactions = sortTransactions((data || [])
      .filter((row) => paymentTypes.has(normalizePaymentCode(row.type)))
      .map((row) => normalizeTransaction(row, methods)))

    const transactions = allTransactions.filter((item) => matchesFilter(item, filter))
    const summary = buildSummary(profile, allTransactions)

    return res.status(200).json({
      status: 'success',
      transactions,
      ...(!paged ? { data: transactions } : { nextCursor: page.next ? encodeCursor({ transactions: page.next }) : null }),
      summary: {
        ...summary,
        count: paged ? result.count || 0 : transactions.length,
        ...(paged ? { totalWithdrawalsMmk: amountValue(profile.totalw) } : {}),
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
