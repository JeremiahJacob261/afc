import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' })

function getDateValue(row) {
  const value = row?.created_at || row?.time || row?.crdate || row?.date
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function getMonthBuckets() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: monthFormatter.format(date),
      deposits: 0,
      withdrawals: 0,
      bets: 0,
    }
  })
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function amountOf(row) {
  const value = Number(row?.amount || row?.stake || row?.aim || 0)
  return Number.isFinite(value) ? value : 0
}

function normalizeStatus(sent) {
  if (sent === true || sent === 'true' || sent === 'success' || sent === 'completed') return 'success'
  if (sent === false || sent === 'false' || sent === 'failed') return 'failed'
  if (sent === 'processing') return 'processing'
  return 'pending'
}

function isMissingColumnError(error, column) {
  if (!error) return false
  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase()
  return error.code === '42703' || message.includes(column.toLowerCase())
}

function warnDashboardQuery(label, error) {
  if (error) console.warn(`Admin dashboard ${label} query failed:`, error)
}

async function readDashboardSection(label, query, fallback) {
  const result = await query()
  if (result.error) {
    warnDashboardQuery(label, result.error)
    return fallback
  }
  return result.data ?? fallback
}

async function readDashboardCount(label, query, fallback = 0) {
  const result = await query()
  if (result.error) {
    warnDashboardQuery(label, result.error)
    return fallback
  }
  return result.count || fallback
}

async function readLatestUsers(supabase) {
  const queryUsers = (dateColumn) => supabase
    .from('users')
    .select(`username,uid,${dateColumn},balance,totald,firstd,countrycode,newrefer`)
    .order('id', { ascending: false })
    .limit(6)

  const result = await queryUsers('created_at')
  if (!result.error) return result.data || []

  if (!isMissingColumnError(result.error, 'created_at')) {
    warnDashboardQuery('latest users', result.error)
    return []
  }

  const fallbackResult = await queryUsers('crdate')
  if (fallbackResult.error) {
    warnDashboardQuery('latest users fallback', fallbackResult.error)
    return []
  }

  return fallbackResult.data || []
}

function buildCharts(notifications = [], placed = []) {
  const buckets = getMonthBuckets()
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  notifications.forEach((item) => {
    const date = getDateValue(item)
    if (!date) return
    const bucket = bucketMap.get(monthKey(date))
    if (!bucket) return

    const type = String(item.type || '').toLowerCase()
    if (type === 'deposit') bucket.deposits += amountOf(item)
    if (type === 'withdraw' || type === 'withdrawer') bucket.withdrawals += amountOf(item)
  })

  placed.forEach((item) => {
    const date = getDateValue(item)
    if (!date) return
    const bucket = bucketMap.get(monthKey(date))
    if (!bucket) return
    bucket.bets += 1
  })

  return buckets
}

function buildActivity({ notifications = [], users = [], placed = [] }) {
  const financeEvents = notifications.slice(0, 5).map((item) => ({
    id: `finance-${item.id || item.uid}`,
    type: item.type || 'finance',
    title: `${item.type || 'Transaction'} ${normalizeStatus(item.sent)}`,
    detail: `${item.username || 'Unknown'} · ${amountOf(item).toFixed(2)} ${item.method || 'USDT'}`,
    time: getDateValue(item)?.toISOString() || null,
    tone: normalizeStatus(item.sent),
  }))

  const userEvents = users.slice(0, 4).map((item) => ({
    id: `user-${item.uid || item.username}`,
    type: 'user',
    title: 'New user registered',
    detail: `${item.username || 'Unknown'} · ${item.uid || 'No UID'}`,
    time: getDateValue(item)?.toISOString() || null,
    tone: item.firstd ? 'success' : 'pending',
  }))

  const betEvents = placed.slice(0, 4).map((item) => ({
    id: `bet-${item.id || item.match_id || item.created_at}`,
    type: 'bet',
    title: 'Bet placed',
    detail: `${item.username || 'Unknown'} · ${amountOf(item).toFixed(2)} USDT`,
    time: getDateValue(item)?.toISOString() || null,
    tone: 'success',
  }))

  return [...financeEvents, ...userEvents, ...betEvents]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 8)
}

export async function getAdminDashboardData() {
  const supabase = getSupabaseAdmin()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const [
    totalUsers,
    activeUsers,
    betsToday,
    reading,
    notifications,
    latestUsers,
    latestMatches,
    placed,
  ] = await Promise.all([
    readDashboardCount('total users', () => supabase.from('users').select('*', { count: 'exact', head: true })),
    readDashboardCount('active users', () => supabase.from('users').select('*', { count: 'exact', head: true }).eq('firstd', true)),
    readDashboardCount('bets today', () => supabase
      .from('placed')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())),
    readDashboardSection('reading', () => supabase.from('reading').select('deposit,withdraw').limit(1).maybeSingle(), null),
    readDashboardSection('notifications', () => supabase
      .from('notification')
      .select('*')
      .neq('address', 'admin')
      .order('id', { ascending: false })
      .limit(300), []),
    readLatestUsers(supabase),
    readDashboardSection('matches', () => supabase
      .from('bets')
      .select('*')
      .eq('verified', false)
      .order('id', { ascending: false })
      .limit(6), []),
    readDashboardSection('placed bets', () => supabase
      .from('placed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500), []),
  ])

  const financeRows = notifications || []
  const pendingTransactions = financeRows.filter((item) => normalizeStatus(item.sent) === 'pending').length
  const totalDeposits = Number(reading?.deposit || 0)
  const totalWithdrawals = Number(reading?.withdraw || 0)

  return {
    status: 'success',
    summary: {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      betsToday: betsToday || 0,
      totalDeposits,
      totalWithdrawals,
      financeBalance: totalDeposits - totalWithdrawals,
      pendingTransactions,
    },
    finance: {
      totals: {
        deposit: totalDeposits,
        withdraw: totalWithdrawals,
        balance: totalDeposits - totalWithdrawals,
      },
      latest: financeRows.slice(0, 8).map((item) => ({
        ...item,
        normalizedStatus: normalizeStatus(item.sent),
      })),
    },
    charts: buildCharts(financeRows, placed || []),
    users: latestUsers || [],
    matches: latestMatches || [],
    activity: buildActivity({
      notifications: financeRows,
      users: latestUsers || [],
      placed: placed || [],
    }),
  }
}

export { normalizeStatus }
