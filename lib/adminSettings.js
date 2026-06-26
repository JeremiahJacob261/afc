export const DEFAULT_FIRST_DEPOSIT_BONUS_PERCENT = 3
export const DEFAULT_MIN_WITHDRAWAL_AMOUNT = 10
export const DEFAULT_MAX_WITHDRAWAL_AMOUNT = 100000
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
    .select('min_withdrawal_amount, max_withdrawal_amount, withdrawal_fee_percent')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (allowDefaultOnMissingTable && isMissingSettingsTable(error)) {
      return {
        minWithdrawalAmount: DEFAULT_MIN_WITHDRAWAL_AMOUNT,
        maxWithdrawalAmount: DEFAULT_MAX_WITHDRAWAL_AMOUNT,
        withdrawalFeePercent: DEFAULT_WITHDRAWAL_FEE_PERCENT,
      }
    }
    throw error
  }

  if (!data) {
    return {
      minWithdrawalAmount: DEFAULT_MIN_WITHDRAWAL_AMOUNT,
      maxWithdrawalAmount: DEFAULT_MAX_WITHDRAWAL_AMOUNT,
      withdrawalFeePercent: DEFAULT_WITHDRAWAL_FEE_PERCENT,
    }
  }

  const minWithdrawalAmount = normalizeWithdrawalAmount(
    data.min_withdrawal_amount ?? DEFAULT_MIN_WITHDRAWAL_AMOUNT,
    'Minimum withdrawal amount'
  )
  const maxWithdrawalAmount = normalizeWithdrawalAmount(
    data.max_withdrawal_amount ?? DEFAULT_MAX_WITHDRAWAL_AMOUNT,
    'Maximum withdrawal amount'
  )

  if (maxWithdrawalAmount < minWithdrawalAmount) {
    const error = new Error('Maximum withdrawal amount cannot be lower than the minimum withdrawal amount')
    error.statusCode = 400
    throw error
  }

  return {
    minWithdrawalAmount,
    maxWithdrawalAmount,
    withdrawalFeePercent: normalizeWithdrawalFeePercent(
      data.withdrawal_fee_percent ?? DEFAULT_WITHDRAWAL_FEE_PERCENT
    ),
  }
}

export async function saveWithdrawalSettings(supabase, settings = {}) {
  const nextSettings = {
    minWithdrawalAmount: settings.minWithdrawalAmount ?? DEFAULT_MIN_WITHDRAWAL_AMOUNT,
    maxWithdrawalAmount: settings.maxWithdrawalAmount ?? DEFAULT_MAX_WITHDRAWAL_AMOUNT,
    withdrawalFeePercent: settings.withdrawalFeePercent ?? DEFAULT_WITHDRAWAL_FEE_PERCENT,
  }

  const minWithdrawalAmount = normalizeWithdrawalAmount(
    nextSettings.minWithdrawalAmount,
    'Minimum withdrawal amount'
  )
  const maxWithdrawalAmount = normalizeWithdrawalAmount(
    nextSettings.maxWithdrawalAmount,
    'Maximum withdrawal amount'
  )

  if (maxWithdrawalAmount < minWithdrawalAmount) {
    const error = new Error('Maximum withdrawal amount cannot be lower than the minimum withdrawal amount')
    error.statusCode = 400
    throw error
  }

  const withdrawalFeePercent = normalizeWithdrawalFeePercent(nextSettings.withdrawalFeePercent)

  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({
      id: 1,
      min_withdrawal_amount: minWithdrawalAmount,
      max_withdrawal_amount: maxWithdrawalAmount,
      withdrawal_fee_percent: withdrawalFeePercent,
      updated_at: new Date().toISOString(),
    })
    .select('min_withdrawal_amount, max_withdrawal_amount, withdrawal_fee_percent')
    .single()

  if (error) throw error

  return {
    minWithdrawalAmount: normalizeWithdrawalAmount(data.min_withdrawal_amount, 'Minimum withdrawal amount'),
    maxWithdrawalAmount: normalizeWithdrawalAmount(data.max_withdrawal_amount, 'Maximum withdrawal amount'),
    withdrawalFeePercent: normalizeWithdrawalFeePercent(data.withdrawal_fee_percent),
  }
}
