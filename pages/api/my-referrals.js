import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

const MODERN_COLUMNS = 'id,username,totald,balance,firstd,refer,lvla,lvlb,created_at'
const LEGACY_COLUMNS = 'id,keyf,username,totald,balance,firstd,refer,lvla,lvlb,crdate,date_cr'

const REFERRAL_LEVELS = [
  { column: 'refer', level: 1, label: 'Level 1' },
  { column: 'lvla', level: 2, label: 'Level 2' },
  { column: 'lvlb', level: 3, label: 'Level 3' },
]

function isMissingColumnError(error) {
  if (!error) return false
  const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase()
  return error.code === '42703' || text.includes('column') || text.includes('schema cache')
}

function normalizeReferral(row, level) {
  const joinedAt = row.created_at || row.crdate || row.date_cr || null
  const id = row.id ?? row.keyf ?? `${level.level}-${row.username || 'referral'}`

  return {
    ...row,
    id,
    key: row.keyf ?? row.id ?? id,
    username: row.username || 'Unknown user',
    totald: Number(row.totald || 0),
    balance: Number(row.balance || 0),
    firstd: Boolean(row.firstd),
    joinedAt,
    level: level.level,
    levelLabel: level.label,
  }
}

async function fetchReferralRows(supabase, referCode, columns) {
  const results = await Promise.all(
    REFERRAL_LEVELS.map(async (level) => {
      const { data, error } = await supabase
        .from('users')
        .select(columns)
        .eq(level.column, referCode)

      return { ...level, data: data || [], error }
    })
  )

  const firstError = results.find((result) => result.error)?.error
  if (firstError) return { data: [], error: firstError }

  const seen = new Set()
  const data = results.flatMap((result) =>
    result.data
      .map((row) => normalizeReferral(row, result))
      .filter((row) => {
        const key = String(row.id ?? row.key ?? `${row.level}-${row.username}`)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  )

  data.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    const aDate = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
    const bDate = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
    return bDate - aDate
  })

  return { data, error: null }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'newrefer')

    if (!profile.newrefer) {
      return res.status(200).json({
        status: 'success',
        refer: '',
        referrals: [],
      })
    }

    let result = await fetchReferralRows(supabase, profile.newrefer, MODERN_COLUMNS)
    if (result.error && isMissingColumnError(result.error)) {
      result = await fetchReferralRows(supabase, profile.newrefer, LEGACY_COLUMNS)
    }

    if (result.error) throw result.error

    return res.status(200).json({
      status: 'success',
      refer: profile.newrefer,
      referrals: result.data || [],
    })
  } catch (error) {
    console.error('My referrals error:', error)
    return sendApiError(res, error)
  }
}
