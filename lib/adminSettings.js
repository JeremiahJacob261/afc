export const DEFAULT_FIRST_DEPOSIT_BONUS_PERCENT = 3
export const DEFAULT_MIN_WITHDRAWAL_AMOUNT = 10
export const WITHDRAWAL_HARD_LIMIT_AMOUNT = 100
export const DEFAULT_DAILY_WITHDRAWAL_LIMIT = 100
export const DEFAULT_ANNUAL_WITHDRAWAL_LIMIT = 100000
// Kept as an alias for older callers. This value is an annual total, not a
// per-request limit; every request is capped by WITHDRAWAL_HARD_LIMIT_AMOUNT.
export const DEFAULT_MAX_WITHDRAWAL_AMOUNT = DEFAULT_ANNUAL_WITHDRAWAL_LIMIT
export const DEFAULT_WITHDRAWAL_FEE_PERCENT = 7

function normalizeBonusPercent(value) {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    const error = new Error('First deposit bonus percent must be between 0 and 100')
    error.statusCode = 400
    throw error
  }

  return Number(percent.toFixed(3))
}

function normalizeWithdrawalAmount(value, fieldName) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error(`${fieldName} must be zero or greater`)
    error.statusCode = 400
    throw error
  }

  return Number(amount.toFixed(3))
}

function normalizeWithdrawalFeePercent(value) {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    const error = new Error('Withdrawal fee percent must be between 0 and 100')
    error.statusCode = 400
    throw error
  }

  return Number(percent.toFixed(3))
}

function normalizeExemptUsernames(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/[\n,]/)
  return [...new Set(values.map((username) => String(username).trim().toLowerCase()).filter(Boolean))]
}

function isMissingSettingsTable(error) {
  return error?.code === '42P01' || /admin_settings/i.test(error?.message || '')
}

export async function getFirstDepositBonusPercent(supabase, { allowDefaultOnMissingTable = true } = {}) {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('first_deposit_bonus_percent')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (allowDefaultOnMissingTable && isMissingSettingsTable(error)) {
      return DEFAULT_FIRST_DEPOSIT_BONUS_PERCENT
    }
    throw error
  }

  if (!data) return DEFAULT_FIRST_DEPOSIT_BONUS_PERCENT
  return normalizeBonusPercent(data.first_deposit_bonus_percent)
}

export async function saveFirstDepositBonusPercent(supabase, value) {
  const firstDepositBonusPercent = normalizeBonusPercent(value)
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({
      id: 1,
      first_deposit_bonus_percent: firstDepositBonusPercent,
      updated_at: new Date().toISOString(),
    })
    .select('first_deposit_bonus_percent')
    .single()

  if (error) throw error
  return normalizeBonusPercent(data.first_deposit_bonus_percent)
}

export async function getWithdrawalSettings(supabase, { allowDefaultOnMissingTable = true } = {}) {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('min_withdrawal_amount, max_withdrawal_amount, daily_withdrawal_limit, withdrawal_limit_exempt_usernames, withdrawal_fee_percent')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (allowDefaultOnMissingTable && isMissingSettingsTable(error)) {
      return {
        minWithdrawalAmount: DEFAULT_MIN_WITHDRAWAL_AMOUNT,
        maxWithdrawalAmount: WITHDRAWAL_HARD_LIMIT_AMOUNT,
        annualWithdrawalLimit: DEFAULT_ANNUAL_WITHDRAWAL_LIMIT,
        dailyWithdrawalLimit: DEFAULT_DAILY_WITHDRAWAL_LIMIT,
        withdrawalLimitExemptUsernames: [],
        withdrawalFeePercent: DEFAULT_WITHDRAWAL_FEE_PERCENT,
      }
    }
    throw error
  }

  if (!data) {
    return {
      minWithdrawalAmount: DEFAULT_MIN_WITHDRAWAL_AMOUNT,
      maxWithdrawalAmount: WITHDRAWAL_HARD_LIMIT_AMOUNT,
      annualWithdrawalLimit: DEFAULT_ANNUAL_WITHDRAWAL_LIMIT,
      dailyWithdrawalLimit: DEFAULT_DAILY_WITHDRAWAL_LIMIT,
      withdrawalLimitExemptUsernames: [],
      withdrawalFeePercent: DEFAULT_WITHDRAWAL_FEE_PERCENT,
    }
  }

  const minWithdrawalAmount = normalizeWithdrawalAmount(
    data.min_withdrawal_amount ?? DEFAULT_MIN_WITHDRAWAL_AMOUNT,
    'Minimum withdrawal amount'
  )
  const annualWithdrawalLimit = normalizeWithdrawalAmount(
    data.max_withdrawal_amount ?? DEFAULT_MAX_WITHDRAWAL_AMOUNT,
    'Annual withdrawal limit'
  )
  const dailyWithdrawalLimit = normalizeWithdrawalAmount(
    data.daily_withdrawal_limit ?? DEFAULT_DAILY_WITHDRAWAL_LIMIT,
    'Daily withdrawal limit'
  )

  if (annualWithdrawalLimit < minWithdrawalAmount || dailyWithdrawalLimit < minWithdrawalAmount) {
    const error = new Error('Withdrawal limits cannot be lower than the minimum withdrawal amount')
    error.statusCode = 400
    throw error
  }

  return {
    minWithdrawalAmount,
    maxWithdrawalAmount: WITHDRAWAL_HARD_LIMIT_AMOUNT,
    annualWithdrawalLimit,
    dailyWithdrawalLimit,
    withdrawalLimitExemptUsernames: normalizeExemptUsernames(data.withdrawal_limit_exempt_usernames),
    withdrawalFeePercent: normalizeWithdrawalFeePercent(
      data.withdrawal_fee_percent ?? DEFAULT_WITHDRAWAL_FEE_PERCENT
    ),
  }
}

export async function saveWithdrawalSettings(supabase, settings = {}) {
  const nextSettings = {
    minWithdrawalAmount: settings.minWithdrawalAmount ?? DEFAULT_MIN_WITHDRAWAL_AMOUNT,
    annualWithdrawalLimit: settings.annualWithdrawalLimit ?? settings.maxWithdrawalAmount ?? DEFAULT_ANNUAL_WITHDRAWAL_LIMIT,
    dailyWithdrawalLimit: settings.dailyWithdrawalLimit ?? DEFAULT_DAILY_WITHDRAWAL_LIMIT,
    withdrawalLimitExemptUsernames: settings.withdrawalLimitExemptUsernames ?? [],
    withdrawalFeePercent: settings.withdrawalFeePercent ?? DEFAULT_WITHDRAWAL_FEE_PERCENT,
  }

  const minWithdrawalAmount = normalizeWithdrawalAmount(
    nextSettings.minWithdrawalAmount,
    'Minimum withdrawal amount'
  )
  const annualWithdrawalLimit = normalizeWithdrawalAmount(
    nextSettings.annualWithdrawalLimit,
    'Annual withdrawal limit'
  )
  const dailyWithdrawalLimit = normalizeWithdrawalAmount(nextSettings.dailyWithdrawalLimit, 'Daily withdrawal limit')

  if (annualWithdrawalLimit < minWithdrawalAmount || dailyWithdrawalLimit < minWithdrawalAmount) {
    const error = new Error('Withdrawal limits cannot be lower than the minimum withdrawal amount')
    error.statusCode = 400
    throw error
  }

  if (minWithdrawalAmount > WITHDRAWAL_HARD_LIMIT_AMOUNT) {
    const error = new Error(`Minimum withdrawal amount cannot exceed the ${WITHDRAWAL_HARD_LIMIT_AMOUNT} USDT hard limit`)
    error.statusCode = 400
    throw error
  }

  const withdrawalFeePercent = normalizeWithdrawalFeePercent(nextSettings.withdrawalFeePercent)

  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({
      id: 1,
      min_withdrawal_amount: minWithdrawalAmount,
      max_withdrawal_amount: annualWithdrawalLimit,
      daily_withdrawal_limit: dailyWithdrawalLimit,
      withdrawal_limit_exempt_usernames: normalizeExemptUsernames(nextSettings.withdrawalLimitExemptUsernames),
      withdrawal_fee_percent: withdrawalFeePercent,
      updated_at: new Date().toISOString(),
    })
    .select('min_withdrawal_amount, max_withdrawal_amount, daily_withdrawal_limit, withdrawal_limit_exempt_usernames, withdrawal_fee_percent')
    .single()

  if (error) throw error

  return {
    minWithdrawalAmount: normalizeWithdrawalAmount(data.min_withdrawal_amount, 'Minimum withdrawal amount'),
    maxWithdrawalAmount: WITHDRAWAL_HARD_LIMIT_AMOUNT,
    annualWithdrawalLimit: normalizeWithdrawalAmount(data.max_withdrawal_amount, 'Annual withdrawal limit'),
    dailyWithdrawalLimit: normalizeWithdrawalAmount(data.daily_withdrawal_limit, 'Daily withdrawal limit'),
    withdrawalLimitExemptUsernames: normalizeExemptUsernames(data.withdrawal_limit_exempt_usernames),
    withdrawalFeePercent: normalizeWithdrawalFeePercent(data.withdrawal_fee_percent),
  }
}
