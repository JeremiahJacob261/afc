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

function isFcfaCode(value) {
  const code = normalizePaymentCode(value)
  return ['fcfa', 'xof', 'cfa'].includes(code)
}

function currencyLabel(value) {
  return isFcfaCode(value) ? 'FCFA' : displayPaymentCode(value || 'FCFA')
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
    currency: currencyLabel(currency),
    label,
    labelKey: options.labelKey || '',
    approximate: options.approximate === true,
  }
}

function timestampOf(row) {
  return row.time || row.created_at || null
}

function getMethodDetails(row, methods) {
  const rawMethod = normalizePaymentCode(row.method || 'fcfa')
  const savedMethod = findPaymentMethod(methods, rawMethod)
  const savedCode = savedMethod ? methodCodeFromRow(savedMethod) : ''
  const methodCode = savedCode || rawMethod || 'fcfa'
  const methodCurrency = currencyLabel(methodCode)
  const methodLabel = savedMethod?.name || displayPaymentCode(row.method || methodCode)
  const rate = getPaymentRate(savedMethod, isFcfaCode(methodCode) ? 1 : 0)

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
  const isFcfa = isFcfaCode(method.methodCode)

  let primaryAmount
  let secondaryAmount = null
  let accountingAmountFcfa = null
  let conversionNote = ''
  let conversionNoteKey = ''
  let conversionNoteValues = {}

  if (type === 'deposit') {
    primaryAmount = amountPayload(amount, method.methodCurrency, 'Submitted amount', { labelKey: 'mobile.transactions.submittedAmount' })

    if (isFcfa) {
      accountingAmountFcfa = amount
    } else if (method.rate) {
      accountingAmountFcfa = Number((amount / method.rate).toFixed(2))
      secondaryAmount = amountPayload(accountingAmountFcfa, 'FCFA', 'FCFA equivalent', { approximate: true })
    } else {
      conversionNote = ``;
    }
  } else {
    accountingAmountFcfa = amount

    if (isFcfa) {
      primaryAmount = amountPayload(amount, 'FCFA', 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
    } else if (method.rate) {
      primaryAmount = amountPayload(amount * method.rate, method.methodCurrency, 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
      secondaryAmount = amountPayload(amount, 'FCFA', 'FCFA amount')
    } else {
      primaryAmount = amountPayload(amount, 'FCFA', 'Payout amount', { labelKey: 'mobile.transactions.payoutAmount' })
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
    accountingAmountFcfa,
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
