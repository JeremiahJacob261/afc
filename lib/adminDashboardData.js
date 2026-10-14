import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isActiveMember } from '@/lib/membership'

function getDateValue(row) {
  const value = row?.created_at || row?.time || row?.crdate || row?.date
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
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

function buildActivity({ notifications = [], users = [], placed = [], membershipBalanceThreshold }) {
  const financeEvents = notifications.slice(0, 5).map((item) => ({
    id: `finance-${item.id || item.uid}`,
    type: item.type || 'finance',
    title: `${item.type || 'Transaction'} ${normalizeStatus(item.sent)}`,
    detail: `${item.username || 'Unknown'} · ${amountOf(item).toLocaleString()} ${item.type === 'deposit' ? (item.method || 'USDT') : 'MMK'}`,
    time: getDateValue(item)?.toISOString() || null,
    tone: normalizeStatus(item.sent),
  }))

  const userEvents = users.slice(0, 4).map((item) => ({
    id: `user-${item.uid || item.username}`,
    type: 'user',
    title: 'New user registered',
    detail: `${item.username || 'Unknown'} · ${item.uid || 'No UID'}`,
    time: getDateValue(item)?.toISOString() || null,
    tone: isActiveMember(item.balance, membershipBalanceThreshold) ? 'success' : 'pending',
  }))

  const betEvents = placed.slice(0, 4).map((item) => ({
    id: `bet-${item.id || item.match_id || item.created_at}`,
    type: 'bet',
    title: 'Bet placed',
    detail: `${item.username || 'Unknown'} · ${amountOf(item).toLocaleString()} MMK`,
    time: getDateValue(item)?.toISOString() || null,
    tone: 'success',
  }))

  return [...financeEvents, ...userEvents, ...betEvents]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 8)
}

export async function getAdminDashboardData() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('read_admin_overview')
  if (error) throw error
  const { membershipBalanceThreshold, totalUsers, activeUsers, betsToday, reading, notifications, latestUsers, matches: latestMatches, placed } = data

  const financeRows = notifications || []
  const pendingTransactions = data.pendingTransactions
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
    charts: data.charts,
    users: latestUsers || [],
    matches: latestMatches || [],
    activity: buildActivity({
      notifications: financeRows,
      users: latestUsers || [],
      placed: placed || [],
      membershipBalanceThreshold,
    }),
    membershipBalanceThreshold,
  }
}

export { normalizeStatus }
