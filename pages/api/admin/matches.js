import { requireAdmin } from '@/lib/adminAuth'
import { ensureUpcomingMatchesCurrent } from '@/lib/apiFootballSync'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const DISPLAY_TIME_ZONE = 'Africa/Lagos'
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 100
const MARKET_STATUS_CHUNK_SIZE = 100
const STATUS_FILTERS = ['all', 'available', 'added']
const DATE_FILTERS = ['all', 'today', 'tomorrow']

function getDateKey(date = new Date(), offsetDays = 0) {
  const target = new Date(date.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(target).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value
    return result
  }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getDateFilterValue(dateFilter) {
  if (dateFilter === 'today') return getDateKey(new Date())
  if (dateFilter === 'tomorrow') return getDateKey(new Date(), 1)
  return ''
}

function normalizeChoice(value, allowed, fallback = 'all') {
  const normalized = String(value || '').trim().toLowerCase()
  return allowed.includes(normalized) ? normalized : fallback
}

function parsePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function parsePageSize(value) {
  const pageSize = Number.parseInt(value, 10)
  if (!Number.isFinite(pageSize) || pageSize < 1) return DEFAULT_PAGE_SIZE
  return Math.min(pageSize, MAX_PAGE_SIZE)
}

function cleanSearchValue(value) {
  return String(value || '').trim().toLowerCase()
}

function sanitizeLikeSearch(value) {
  return cleanSearchValue(value)
    .replace(/[%,()*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNumericSearch(search) {
  return /^\d+$/.test(String(search || '').trim())
}

function getRequestParams(req) {
  const source = req.method === 'POST' ? req.body || {} : req.query || {}
  const legacyPageSearch = req.method === 'POST'
    && source.page !== undefined
    && Number.isNaN(Number(source.page))
    && source.q === undefined
    && source.search === undefined

  return {
    search: cleanSearchValue(source.q ?? source.search ?? (legacyPageSearch ? source.page : '')),
    date: normalizeChoice(source.date, DATE_FILTERS),
    status: normalizeChoice(source.status, STATUS_FILTERS),
    page: parsePage(legacyPageSearch ? source.pageNumber : source.page),
    pageSize: parsePageSize(source.pageSize),
  }
}

function applyMatchFilters(query, { search = '', date = 'all' } = {}) {
  const dateValue = getDateFilterValue(date)
  if (dateValue) query = query.eq('date', dateValue)

  if (!search) return query

  if (isNumericSearch(search)) {
    return query.eq('id', Number(search))
  }

  const sanitizedSearch = sanitizeLikeSearch(search)
  if (!sanitizedSearch) return query

  return query.or([
    `home_name.ilike.%${sanitizedSearch}%`,
    `away_name.ilike.%${sanitizedSearch}%`,
    `league.ilike.%${sanitizedSearch}%`,
  ].join(','))
}

function buildMatchQuery(supabase, params = {}, selectOptions = {}) {
  let query = supabase
    .from('upcoming_matches')
    .select('*', selectOptions)

  query = applyMatchFilters(query, params)

  return query
    .order('timest', { ascending: true })
    .order('id', { ascending: true })
}

async function attachMarketStatus(supabase, fixtures) {
  const matchIds = [...new Set((fixtures || []).map((fixture) => String(fixture.id || '')).filter(Boolean))]
  if (!matchIds.length) return fixtures || []

  const { data, error } = await supabase
    .from('bets')
    .select('match_id,verified')
    .in('match_id', matchIds)

  if (error) throw error

  const statusByMatchId = new Map((data || []).map((match) => [
    String(match.match_id),
    {
      market_added: true,
      market_verified: Boolean(match.verified),
    },
  ]))

  return (fixtures || []).map((fixture) => {
    const status = statusByMatchId.get(String(fixture.id))
    return {
      ...fixture,
      market_added: Boolean(status?.market_added),
      market_verified: Boolean(status?.market_verified),
    }
  })
}

function attachMarketStatusFromMap(fixtures, statusByMatchId) {
  return (fixtures || []).map((fixture) => {
    const status = statusByMatchId.get(String(fixture.id))
    return {
      ...fixture,
      market_added: Boolean(status?.market_added),
      market_verified: Boolean(status?.market_verified),
    }
  })
}

async function loadAllMarketStatuses(supabase) {
  const statusByMatchId = new Map()
  let from = 0
  let hasMore = true

  while (hasMore) {
    const to = from + MARKET_STATUS_CHUNK_SIZE - 1
    const { data, error } = await supabase
      .from('bets')
      .select('match_id,verified')
      .order('id', { ascending: true })
      .range(from, to)

    if (error) throw error

    ;(data || []).forEach((match) => {
      statusByMatchId.set(String(match.match_id), {
        market_added: true,
        market_verified: Boolean(match.verified),
      })
    })

    hasMore = (data || []).length === MARKET_STATUS_CHUNK_SIZE
    from += MARKET_STATUS_CHUNK_SIZE
  }

  return statusByMatchId
}

function matchesStatus(fixture, status) {
  if (status === 'available') return !fixture.market_added
  if (status === 'added') return fixture.market_added
  return true
}

async function loadMatchesWithStatusFilter(supabase, params) {
  const statusByMatchId = await loadAllMarketStatuses(supabase)
  const { page, pageSize, status } = params
  const targetStart = (page - 1) * pageSize
  const targetEnd = targetStart + pageSize
  const rows = []
  let total = 0
  let from = 0
  let baseTotal = null

  while (baseTotal === null || from < baseTotal) {
    const to = from + pageSize - 1
    const { data, count, error } = await buildMatchQuery(supabase, params, { count: 'exact' })
      .range(from, to)

    if (error) throw error

    baseTotal = count || 0

    const fixtures = attachMarketStatusFromMap(data || [], statusByMatchId)
    fixtures.forEach((fixture) => {
      if (!matchesStatus(fixture, status)) return

      if (total >= targetStart && total < targetEnd) {
        rows.push(fixture)
      }
      total += 1
    })

    if (!(data || []).length) break
    from += pageSize
  }

  return {
    data: rows,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  }
}

export async function loadAdminMatches(supabase, {
  search = '',
  date = 'all',
  status = 'all',
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  refresh = true,
} = {}) {
  if (refresh) {
    try {
      await ensureUpcomingMatchesCurrent(supabase)
    } catch (syncError) {
      console.error('Unable to refresh upcoming matches:', syncError)
    }
  }

  const params = {
    search: cleanSearchValue(search),
    date: normalizeChoice(date, DATE_FILTERS),
    status: normalizeChoice(status, STATUS_FILTERS),
    page: parsePage(page),
    pageSize: parsePageSize(pageSize),
  }

  if (params.status !== 'all') {
    return loadMatchesWithStatusFilter(supabase, params)
  }

  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  const { data, count, error } = await buildMatchQuery(supabase, params, { count: 'exact' })
    .range(from, to)

  if (error) throw error

  const total = count || 0

  return {
    data: await attachMarketStatus(supabase, data || []),
    page: params.page,
    pageSize: params.pageSize,
    total,
    hasMore: params.page * params.pageSize < total,
  }
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    const data = await loadAdminMatches(supabase, getRequestParams(req))

    return res.status(200).json(data)
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin matches error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
