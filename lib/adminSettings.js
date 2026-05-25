export const DEFAULT_FIRST_DEPOSIT_BONUS_PERCENT = 3

function normalizeBonusPercent(value) {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    const error = new Error('First deposit bonus percent must be between 0 and 100')
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
