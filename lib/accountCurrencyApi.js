import { accountCurrency, CURRENCY_RATES, convertCurrency, ACCOUNT_CURRENCY_ROUTES, formatLedgerText as currencyText } from './currencyPolicy.js'

const routes = new Set(ACCOUNT_CURRENCY_ROUTES)
const monetaryFields = new Set(['balance', 'totald', 'totalw', 'dailywl', 'betspend', 'betwon', 'stake', 'aim', 'profit', 'aone', 'atwo', 'athree', 'amount', 'ledgerAmount', 'requestedAmount', 'feeAmount', 'totalAmount', 'minimumBalance', 'lastAmount', 'membershipBalanceThreshold', 'minWithdrawalAmount', 'maxWithdrawalAmount', 'dailyWithdrawalLimit', 'annualWithdrawalLimit', 'minimum', 'maximum', 'accountingAmountMmk', 'totalDepositsMmk', 'totalWithdrawalsMmk', 'remaining', 'returnAmount', 'expectedReturn', 'potentialWinnings', 'reward', 'requiredDeposit', 'nextDeposit', 'totalDeposit', 'depositLimit', 'fee', 'total'])


export function accountPayload(value, code, key = '') {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(item => accountPayload(item, code, key))
  if (typeof value === 'object') {
    // History leads with the account equivalent; the receipt/payout remains
    // available separately in its actual payment currency.
    if (value.primaryAmount && value.accountingAmountMmk != null) {
      const { primaryAmount, secondaryAmount, ...rest } = value
      return {
        ...accountPayload(rest, code, key),
        primaryAmount: { value: convertCurrency(value.accountingAmountMmk, 'MMK', code), currency: code, label: 'Amount', labelKey: 'common.amount', approximate: primaryAmount.approximate === true },
        secondaryAmount: primaryAmount,
      }
    }
    const paymentDeposit = value.type === 'deposit' || value.category === 'deposit'
    if (value.messageKey === 'mobile.notifications.messages.transactionUpdate' && value.type !== 'deposit') {
      value = { ...value, messageValues: { ...value.messageValues, amount: convertCurrency(value.messageValues?.amount, 'MMK', code), method: code } }
    }
    if (String(value.messageKey || '').startsWith('mobile.notifications.events.') && !paymentDeposit) {
      const messageValues = { ...value.messageValues }
      for (const field of ['amount', 'payout', 'stake']) {
        if (messageValues[field] != null) messageValues[field] = convertCurrency(messageValues[field], 'MMK', code)
      }
      if (messageValues.method === 'MMK') messageValues.method = code
      value = { ...value, messageValues }
    }
    // Submitted and paid amounts stay in the payment method's currency.
    if ('value' in value && 'currency' in value) {
      if (value.currency !== 'MMK' || key === 'primaryAmount') return value
      return { ...value, value: convertCurrency(value.value, 'MMK', code), currency: code, label: currencyText(value.label || '', code) }
    }
    if (key === 'messageValues') return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, typeof item === 'string' && /\d\s+MMK\b/.test(item) ? currencyText(item, code) : item]))
    return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, ['amount', 'message'].includes(field) && paymentDeposit ? item : accountPayload(item, code, field)]))
  }
  if (monetaryFields.has(key) && value !== '' && Number.isFinite(Number(value))) return convertCurrency(value, 'MMK', code)
  if (typeof value === 'string' && /\d\s+MMK\b/.test(value)) return currencyText(value, code)
  if (typeof value === 'string' && ['message', 'minimum', 'label', 'lastPrize', 'title', 'body', 'text', 'detail'].includes(key)) return currencyText(value, code)
  return value
}

export function withAccountCurrency(handler) {
  return async (req, res) => {
    const route = (req.url || '').split('?')[0]
    if (req.headers?.['x-account-currency-contract'] !== '1' || !routes.has(route)) return handler(req, res)
    const { getCurrentProfile, sendApiError } = await import('./apiAuth.js')
    try {
      const { profile } = await getCurrentProfile(req, '*')
      const code = accountCurrency(profile)
      const currency = { code, label: code, unitsPerUsdt: CURRENCY_RATES[code], ledgerCode: 'MMK', contract: 1 }
      req.accountCurrency = currency
      const inputField = route === '/api/place-bet' ? 'stake' : route === '/api/withdraw' ? 'amount' : null
      if (inputField && req.body?.[inputField] != null) req.body = { ...req.body, [inputField]: convertCurrency(req.body[inputField], code, 'MMK') ?? NaN }
      const queryField = route === '/api/mobile/bet-quote' ? 'stake' : route === '/api/mobile/withdrawal-quote' ? 'amount' : null
      if (queryField && req.query?.[queryField] != null) req.query = { ...req.query, [queryField]: String(convertCurrency(req.query[queryField], code, 'MMK') ?? NaN) }
      const json = res.json.bind(res)
      res.json = payload => {
        const converted = accountPayload(payload, code)
        const annotate = item => item && typeof item === 'object' ? { ...item, currency } : item
        return json(Array.isArray(converted) ? converted.map(annotate) : annotate(converted))
      }
      return await handler(req, res)
    } catch (error) { return sendApiError(res, error) }
  }
}
