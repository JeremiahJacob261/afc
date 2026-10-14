import apiMessages from '../locales/api-messages.json'

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[.!]+$/, '')
const messageKeys = new Map(Object.entries(apiMessages))

// APIs still return legacy English messages. Keep that compatibility at one
// boundary, preserve server-provided amounts/counts, and hide unknown raw errors.
export function translateApiMessage(error, t, fallbackKey = 'messages.anErrorOccurred') {
  // Mobile transports retain the response body on payload; keep its reason code.
  error = error?.payload ? { ...error.payload, status: error.status } : error
  const message = typeof error === 'string' ? error : error?.message
  const code = typeof error === 'object' ? error?.code : ''
  const status = Number(error?.statusCode || error?.httpStatus || error?.status)
  const normalized = normalize(message)
  const codeKeys = {
    SESSION_EXPIRED: 'messages.sessionExpired',
    PROFILE_NOT_FOUND: 'messages.profileNotFound',
    BET_INVALID_DETAILS: 'messages.betInvalidDetails',
    BET_INVALID_STAKE: 'messages.betInvalidStake',
    BET_SELECTION_REQUIRED: 'messages.chooseScoreMarket',
    BET_INSUFFICIENT_BALANCE: 'mobile.match.insufficientBalance',
    BET_ODDS_CHANGED: 'messages.oddsChanged',
    BET_CLOSED: 'mobile.match.matchExpired',
    BET_SETTLED: 'messages.betSettled',
    BET_MATCH_NOT_FOUND: 'messages.matchNotFound',
    BET_MARKET_UNAVAILABLE: 'mobile.match.marketUnavailable',
    BET_LIMIT_REACHED: 'mobile.match.maxBetsReached',
    BET_REQUEST_CONFLICT: 'messages.betRequestConflict',
    invalid_credentials: 'messages.incorrectLoginDetails',
    email_not_confirmed: 'messages.emailNotConfirmed',
    weak_password: 'messages.strongerPasswordMessage',
    email_address_invalid: 'messages.invalidEmailMessage',
    user_already_exists: 'messages.emailRegistered',
    email_exists: 'messages.emailRegistered',
    over_request_rate_limit: 'messages.tooManyRequests',
    over_email_send_rate_limit: 'messages.tooManyRequests',
    PAYMENT_REQUEST_PENDING: 'messages.paymentRequestPending',
    WITHDRAWAL_PENDING: 'messages.withdrawalPending',
    WITHDRAWAL_COOLDOWN: 'messages.withdrawalCooldown',
    rate_changed: 'mobile.deposit.rateChanged',
    receipt_expired: 'mobile.deposit.receiptExpired',
    'auth/invalid-email': 'messages.invalidEmailMessage',
    'auth/user-not-found': 'messages.resetEmailUnavailable',
    'auth/too-many-requests': 'messages.tooManyRequests',
    'auth/network-request-failed': 'messages.checkConnectionTryAgain',
  }
  if (code === 'BET_MINIMUM_STAKE') return error?.details?.minimum
    ? t('messages.betMinimum', { minimum: error.details.minimum }) : t('messages.stakeMinimum')
  if (code === 'SUBMISSION_UNCONFIRMED') return t(fallbackKey)
  if (codeKeys[code]) return t(codeKeys[code])
  if (/invalid login credentials|invalid credentials/.test(normalized)) return t('messages.incorrectLoginDetails')
  if (status === 401 || /authentication required|invalid or expired session|please sign in again|^unauthorized$/.test(normalized)) return t('messages.sessionExpired')
  if (status === 403) return t('messages.permissionDenied')
  if (status === 429) return t('messages.tooManyRequests')
  if (/profile not found/.test(normalized)) return t('messages.profileNotFound')
  if (/match not found/.test(normalized)) return t('messages.matchNotFound')
  if (/bet not found/.test(normalized)) return t('messages.betNotFound')
  if (/minimum stake/.test(normalized)) {
    const minimum = String(message).match(/minimum stake\s*(?:is|:)\s*(.+)/i)?.[1]?.replace(/[.!]$/, '')
    return minimum ? t('messages.betMinimum', { minimum }) : t('messages.stakeMinimum')
  }
  if (/invalid bet details/.test(normalized)) return t('messages.betInvalidDetails')
  if (/duplicate bet id/.test(normalized)) return t('messages.betRequestConflict')
  if (/maximum number of bets/.test(normalized)) return t('mobile.match.maxBetsReached')
  if (/already settled/.test(normalized)) return t('messages.betSettled')
  if (/market is not available/.test(normalized)) return t('mobile.match.marketUnavailable')
  if (/(match|bet).*expired|betting.*closed/.test(normalized)) return t('mobile.match.matchExpired')
  if (/insufficient funds|insufficient balance|not enough|enough\s+(mmk|usdt|fcfa)/.test(normalized)) return t('mobile.match.insufficientBalance')

  // Check transport failures before the dictionary: even an exact "Network
  // error" match must not encourage blindly resubmitting a payment or bet.
  const submissions = ['messages.unablePlaceBet', 'messages.depositFailed', 'messages.unableSubmitWithdrawal', 'messages.unableBindWallet', 'messages.unableSetPin']
  if (/network|fetch failed|failed to fetch|load failed/.test(normalized)) return t(submissions.includes(fallbackKey) ? fallbackKey : 'messages.checkConnectionTryAgain')
  const key = messageKeys.get(normalized)
  if (key) return t(key)
  if (/invalid login credentials|invalid credentials/.test(normalized)) return t('messages.incorrectLoginDetails')
  if (/email not confirmed/.test(normalized)) return t('messages.emailNotConfirmed')
  if (/too many requests|rate limit/.test(normalized)) return t('messages.tooManyRequests')
  if (/no transaction pin has been set/.test(normalized)) return t('mobile.withdraw.noPinSet')
  if (normalized === 'wrong password') return t('mobile.withdraw.wrongPin')

  const betRequirement = normalized.match(/place (\d+) bets after your latest successful deposit.*you have placed (\d+)/)
  if (betRequirement) return t('mobile.withdraw.betRequirementWithCount', { required: betRequirement[1], placed: betRequirement[2] })
  const sixBets = normalized.match(/six bets are required.*you have placed (\d+)/)
  if (sixBets) return t('mobile.withdraw.betRequirementWithCount', { required: 6, placed: sixBets[1] })
  if (/six bets are required/.test(normalized)) return t('mobile.withdraw.betRequirement')
  if (/after your latest successful deposit/.test(normalized)) return t('mobile.withdraw.betRequirement')
  if (/pending.*deposit|pending.*withdrawal/.test(normalized)) return t('messages.paymentRequestPending')
  if (/24 hours/.test(normalized)) return t('messages.withdrawalCooldown')

  const limit = normalized.match(/(minimum|maximum).*?(\d[\d,.]*)\s*mmk/)
  if (limit) {
    const amount = limit[2]
    if (/deposit/.test(normalized)) return t('messages.minimumDeposit', { amount, currency: 'MMK' })
    if (/withdraw/.test(normalized)) return t(limit[1] === 'minimum' ? 'messages.minimumWithdrawal' : 'mobile.withdraw.maximumWithdrawal', { amount })
  }
  if (/daily withdrawal limit/.test(normalized)) return t('messages.dailyWithdrawalLimitReached')
  if (/annual withdrawal limit/.test(normalized)) return t('messages.annualWithdrawalLimitReached')
  if (/withdrawal method rate/.test(normalized)) return t('messages.withdrawalRateUnavailable')
  if (/withdrawals.*(temporarily unavailable|disabled|unavailable)/.test(normalized)) return t('messages.withdrawalsUnavailable')
  if (/receipt.*already used/.test(normalized)) return t('messages.receiptAlreadyUsed')
  if (/unknown or unavailable deposit method|payment method is not available/.test(normalized)) return t('messages.paymentMethodUnavailable')
  if (/payment destination is no longer available/.test(normalized)) return t('mobile.deposit.noPaymentAddress')
  if (/wallet already linked/.test(normalized)) return t('messages.walletAlreadyLinked')
  if (/missing wallet details|missing bank account details/.test(normalized)) return t('messages.walletDetailsInvalid')
  if (/already have a transaction pin/.test(normalized)) return t('messages.pinAlreadySet')
  if (/pin must be 4 digits/.test(normalized)) return t('messages.pinFourDigits')
  if (/odds changed/.test(normalized)) return t('messages.oddsChanged')
  if (/receipt upload expired/.test(normalized)) return t('mobile.deposit.receiptExpired')
  const receiptSize = normalized.match(/use a jpeg, png or webp.*up to (\d+) mb/)
  if (receiptSize) return t('messages.receiptFileRequirements', { size: receiptSize[1] })
  if (/invalid receipt|receipt url unavailable/.test(normalized)) return t('messages.receiptInvalid')
  if (/invalid deposit details/.test(normalized)) return t('messages.depositInvalidDetails')
  if (/invalid amount or request id/.test(normalized)) return t('messages.paymentInvalidDetails')
  if (/invalid amount/.test(normalized)) return t('messages.amountInvalid')
  if (/fee changed/.test(normalized)) return t('messages.feeChanged')
  if (/rate unavailable/.test(normalized)) return t('messages.rateUnavailable')
  if (/invalid registration details or referral code/.test(normalized)) return t('messages.registrationInvalid')
  return t(fallbackKey)
}
