import enCommon from '../locales/en/common.json'
import myCommon from '../locales/my/common.json'

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[.!]+$/, '')
const messageKeys = new Map()

function collectMessages(value, prefix = '') {
  for (const [name, entry] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${name}` : name
    if (entry && typeof entry === 'object') collectMessages(entry, key)
    else if (typeof entry === 'string' && !entry.includes('{{')) messageKeys.set(normalize(entry), key)
  }
}

collectMessages(enCommon)
collectMessages(myCommon)

// APIs still return legacy English messages. Keep that compatibility at one
// boundary, preserve server-provided amounts/counts, and hide unknown raw errors.
export function translateApiMessage(error, t, fallbackKey = 'messages.anErrorOccurred') {
  const message = typeof error === 'string' ? error : error?.message
  const code = typeof error === 'object' ? error?.code : ''
  const normalized = normalize(message)
  const codeKeys = {
    PAYMENT_REQUEST_PENDING: 'messages.paymentRequestPending',
    WITHDRAWAL_PENDING: 'messages.withdrawalPending',
    WITHDRAWAL_COOLDOWN: 'messages.withdrawalCooldown',
    rate_changed: 'mobile.deposit.rateChanged',
    'auth/invalid-email': 'messages.invalidEmailMessage',
    'auth/user-not-found': 'messages.resetEmailUnavailable',
    'auth/too-many-requests': 'messages.tooManyRequests',
    'auth/network-request-failed': 'messages.checkConnectionTryAgain',
  }
  if (codeKeys[code]) return t(codeKeys[code])
  if (/insufficient funds|insufficient balance|not enough|enough\s+(mmk|usdt|fcfa)/.test(normalized)) return t('mobile.match.insufficientBalance')

  const key = messageKeys.get(normalized)
  if (key) return t(key)
  if (/invalid login credentials|invalid credentials/.test(normalized)) return t('messages.incorrectLoginDetails')
  if (/email not confirmed/.test(normalized)) return t('messages.emailNotConfirmed')
  if (/too many requests|rate limit/.test(normalized)) return t('messages.tooManyRequests')
  if (/network|fetch failed/.test(normalized)) return t('messages.checkConnectionTryAgain')
  if (/no transaction pin has been set/.test(normalized)) return t('mobile.withdraw.noPinSet')
  if (normalized === 'wrong password') return t('mobile.withdraw.wrongPin')

  const betRequirement = normalized.match(/place (\d+) bets after your latest successful deposit.*you have placed (\d+)/)
  if (betRequirement) return t('mobile.withdraw.betRequirementWithCount', { required: betRequirement[1], placed: betRequirement[2] })
  if (/after your latest successful deposit/.test(normalized)) return t('mobile.withdraw.betRequirement')
  if (/pending.*deposit|pending.*withdrawal/.test(normalized)) return t('messages.paymentRequestPending')
  if (/24 hours/.test(normalized)) return t('messages.withdrawalCooldown')

  const limit = normalized.match(/(minimum|maximum).*?(\d[\d,.]*)\s*mmk/)
  if (limit) {
    const amount = limit[2]
    if (/deposit/.test(normalized)) return t('messages.minimumDeposit', { amount, currency: 'MMK' })
    return t(limit[1] === 'minimum' ? 'messages.minimumWithdrawal' : 'mobile.withdraw.maximumWithdrawal', { amount })
  }
  if (/daily withdrawal limit/.test(normalized)) return t('messages.dailyWithdrawalLimitReached')
  if (/annual withdrawal limit/.test(normalized)) return t('messages.annualWithdrawalLimitReached')
  if (/withdrawal method rate/.test(normalized)) return t('messages.withdrawalRateUnavailable')
  if (/temporarily unavailable/.test(normalized)) return t('messages.withdrawalsUnavailable')
  if (/receipt.*already used/.test(normalized)) return t('messages.receiptAlreadyUsed')
  if (/unknown or unavailable deposit method|payment method is not available/.test(normalized)) return t('messages.paymentMethodUnavailable')
  if (/payment destination is no longer available/.test(normalized)) return t('mobile.deposit.noPaymentAddress')
  if (/wallet already linked/.test(normalized)) return t('messages.walletAlreadyLinked')
  if (/missing wallet details|missing bank account details/.test(normalized)) return t('messages.walletDetailsInvalid')
  if (/already have a transaction pin/.test(normalized)) return t('messages.pinAlreadySet')
  if (/pin must be 4 digits/.test(normalized)) return t('messages.pinFourDigits')
  if (/odds changed/.test(normalized)) return t('messages.oddsChanged')
  return t(fallbackKey)
}
