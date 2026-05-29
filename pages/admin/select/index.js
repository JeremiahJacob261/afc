import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay'
import { loadAdminMatches } from '@/pages/api/admin/matches'

const DISPLAY_TIME_ZONE = 'Africa/Lagos'
const PAGE_SIZE = 100

const DATE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
]

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'added', label: 'Already added' },
]

const DATE_FILTER_KEYS = DATE_FILTERS.map((filter) => filter.key)
const STATUS_FILTER_KEYS = STATUS_FILTERS.map((filter) => filter.key)

function normalizeFilter(value, allowed, fallback = 'all') {
  const nextValue = String(value || '').trim().toLowerCase()
  return allowed.includes(nextValue) ? nextValue : fallback
}

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

function getFixtureDateKey(fixture) {
  if (fixture?.date) return String(fixture.date).slice(0, 10)

  const startMs = getMatchStartMs(fixture)
  if (!startMs) return 'unknown'

  return getDateKey(new Date(startMs))
}

function formatDateHeading(dateKey, dateKeys) {
  if (dateKey === dateKeys.today) return 'Today'
  if (dateKey === dateKeys.tomorrow) return 'Tomorrow'
  if (dateKey === 'unknown') return 'Date TBD'

  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateKey

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function sortByKickoff(a, b) {
  return (getMatchStartMs(a) || 0) - (getMatchStartMs(b) || 0)
}

function groupFixtures(fixtures) {
  const groups = new Map()

  fixtures.forEach((fixture) => {
    const dateKey = getFixtureDateKey(fixture)
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey).push(fixture)
  })

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    items: items.sort(sortByKickoff),
  }))
}

function queryValue(value) {
  if (Array.isArray(value)) return String(value[0] || '')
  return String(value || '')
}

function getPageState(page = {}) {
  return {
    page: page.page || 1,
    pageSize: page.pageSize || PAGE_SIZE,
    total: page.total || 0,
    hasMore: Boolean(page.hasMore),
  }
}

function normalizeMatchResponse(result) {
  if (Array.isArray(result)) {
    return {
      data: result,
      page: 1,
      pageSize: PAGE_SIZE,
      total: result.length,
      hasMore: false,
    }
  }

  return {
    data: Array.isArray(result?.data) ? result.data : [],
    page: result?.page || 1,
    pageSize: result?.pageSize || PAGE_SIZE,
    total: result?.total || 0,
    hasMore: Boolean(result?.hasMore),
  }
}

export default function Select({ initialPage = {}, initialFilters = {}, dateKeys }) {
  const router = useRouter()
  const firstFetchSkipped = useRef(false)
  const [fixtures, setFixtures] = useState(initialPage.data || [])
  const [pageState, setPageState] = useState(getPageState(initialPage))
  const [searchValue, setSearchValue] = useState(initialFilters.q || '')
  const [dateFilter, setDateFilter] = useState(initialFilters.date || 'all')
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const replaceUrlState = () => {
    const nextQuery = {}
    const q = searchValue.trim()
    if (q) nextQuery.q = q
    if (dateFilter !== 'all') nextQuery.date = dateFilter
    if (statusFilter !== 'all') nextQuery.status = statusFilter

    const currentQ = queryValue(router.query.q).trim()
    const currentDate = normalizeFilter(queryValue(router.query.date), DATE_FILTER_KEYS)
    const currentStatus = normalizeFilter(queryValue(router.query.status), STATUS_FILTER_KEYS)
    const hasExtraParams = Object.keys(router.query).some((key) => !['q', 'date', 'status'].includes(key))
    const queryMatches = currentQ === (nextQuery.q || '')
      && currentDate === (nextQuery.date || 'all')
      && currentStatus === (nextQuery.status || 'all')
      && !hasExtraParams

    if (!queryMatches) {
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
    }
  }

  const fetchFixtures = async ({ page = 1, append = false, signal } = {}) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })

      const q = searchValue.trim()
      if (q) params.set('q', q)
      if (dateFilter !== 'all') params.set('date', dateFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/admin/matches?${params.toString()}`, { signal })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) router.push('/admin')
        throw new Error(result.message || 'Unable to load fixtures')
      }

      const nextPage = normalizeMatchResponse(result)
      setFixtures((current) => {
        if (!append) return nextPage.data

        const seen = new Set(current.map((fixture) => String(fixture.id)))
        return [
          ...current,
          ...nextPage.data.filter((fixture) => !seen.has(String(fixture.id))),
        ]
      })
      setPageState(getPageState(nextPage))
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        console.log(fetchError)
        setError(fetchError.message || 'Unable to load fixtures')
      }
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!router.isReady) return undefined

    let controller
    const shouldSkipFetch = !firstFetchSkipped.current
    if (shouldSkipFetch) firstFetchSkipped.current = true

    const timeout = window.setTimeout(() => {
      replaceUrlState()

      if (shouldSkipFetch) return

      controller = new AbortController()
      fetchFixtures({ page: 1, signal: controller.signal })
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      if (controller) controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, router, searchValue, statusFilter])

  const summary = useMemo(() => {
    return fixtures.reduce((result, fixture) => {
      const fixtureDate = getFixtureDateKey(fixture)
      result.total += 1
      if (fixtureDate === dateKeys.today) result.today += 1
      if (fixtureDate === dateKeys.tomorrow) result.tomorrow += 1
      if (fixture.market_added) result.added += 1
      if (!fixture.market_added) result.available += 1
      return result
    }, {
      total: 0,
      today: 0,
      tomorrow: 0,
      available: 0,
      added: 0,
    })
  }, [dateKeys, fixtures])

  const visibleFixtures = useMemo(() => {
    return [...fixtures].sort(sortByKickoff)
  }, [fixtures])

  const groupedFixtures = useMemo(() => groupFixtures(visibleFixtures), [visibleFixtures])

  const resetFilters = () => {
    setSearchValue('')
    setDateFilter('all')
    setStatusFilter('all')
  }

  const refreshFixtures = async () => {
    await fetchFixtures({ page: 1 })
  }

  const loadMoreFixtures = async () => {
    if (!pageState.hasMore || loadingMore) return
    await fetchFixtures({ page: pageState.page + 1, append: true })
  }

  return (
    <>
      <Head>
        <title>Select Match | EFC Admin</title>
      </Head>

      <div className="space-y-5">
        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1BB6FF]">Match Library</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Select upcoming fixture</h2>
              <p className="mt-1 text-sm text-zinc-500">Search by fixture ID, team, or league before adding odds.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:min-w-[700px]">
              <StatCard label="Total" value={pageState.total} icon={Trophy} />
              <StatCard label="Today" value={summary.today} icon={CalendarDays} />
              <StatCard label="Tomorrow" value={summary.tomorrow} icon={Clock3} />
              <StatCard label="Available" value={summary.available} icon={Plus} tone="text-[#8EE5FF]" />
              <StatCard label="Added" value={summary.added} icon={CheckCircle2} tone="text-emerald-300" />
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#151515] p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/[0.06] p-1 2xl:w-[430px]">
              <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search fixture ID, team, league..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <FilterGroup label="Date" filters={DATE_FILTERS} active={dateFilter} onChange={setDateFilter} />
              <FilterGroup label="Status" filters={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
              <button
                type="button"
                onClick={refreshFixtures}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh fixtures
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-[#C61F41]/30 bg-[#C61F41]/10 px-4 py-3 text-sm text-[#ff8ca0]">
              {error}
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-semibold text-white">{visibleFixtures.length}</span> of {pageState.total} matching fixtures
            </p>
            {(searchValue || dateFilter !== 'all' || statusFilter !== 'all') ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
                Reset filters
              </button>
            ) : null}
          </div>

          {groupedFixtures.length ? groupedFixtures.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {formatDateHeading(group.dateKey, dateKeys)}
                </h3>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-zinc-400">
                  {group.items.length}
                </span>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {group.items.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} router={router} />
                ))}
              </div>
            </div>
          )) : loading ? (
            <div className="rounded-[24px] border border-white/10 bg-[#151515] p-10 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1BB6FF]" />
              <p className="mt-3 text-sm text-zinc-500">Loading fixtures...</p>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 font-semibold text-white">No fixtures found</p>
              <p className="mt-2 text-sm text-zinc-500">Try another search or loosen the active filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF]"
              >
                Reset filters
              </button>
            </div>
          )}

          {pageState.hasMore && groupedFixtures.length ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMoreFixtures}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#1BB6FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Load more
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}

function FilterGroup({ label, filters, active, onChange }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">{label}</span>
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/[0.06] p-1">
        {filters.map((filter) => {
          const selected = filter.key === active
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChange(filter.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'bg-white text-black'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone = 'text-[#1BB6FF]' }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-600">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function FixtureCard({ fixture, router }) {
  const display = useClientMatchDisplay(fixture)
  const marketAdded = Boolean(fixture.market_added)
  const marketVerified = Boolean(fixture.market_verified)

  const openFixture = () => {
    if (marketAdded) {
      router.push(`/admin/matchdetail/${fixture.id}`)
      return
    }

    router.push(`/admin/input?id=${fixture.id}`)
  }

  return (
    <article className="rounded-[24px] border border-white/10 bg-[#151515] p-4 transition hover:border-[#1BB6FF]/40 hover:bg-[#202020]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#1BB6FF]/10 px-3 py-1 text-xs font-semibold text-[#8EE5FF]">
              Fixture ID: {fixture.id}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              marketAdded
                ? 'bg-emerald-400/10 text-emerald-300'
                : 'bg-white/[0.06] text-zinc-300'
            }`}>
              {marketAdded ? (marketVerified ? 'Settled market' : 'Market added') : 'Ready for odds'}
            </span>
          </div>
          <p className="mt-3 truncate text-sm text-zinc-500">{fixture.league || 'League not set'}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/[0.05] px-3 py-2 text-sm text-zinc-300">
          <CalendarDays className="h-4 w-4 text-[#1BB6FF]" />
          <span>{display.date}</span>
          <span className="text-zinc-600">/</span>
          <span>{display.time}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <TeamBlock logo={fixture.home_logo} name={fixture.home_name || 'Home'} />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-[#1BB6FF]">
          VS
        </div>
        <TeamBlock logo={fixture.away_logo} name={fixture.away_name || 'Away'} align="right" />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-zinc-600" />
          {marketAdded ? 'Duplicate odds are blocked for this fixture.' : 'No market found yet.'}
        </div>

        <button
          type="button"
          onClick={openFixture}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
            marketAdded
              ? 'bg-white/[0.08] text-zinc-200 hover:bg-white hover:text-black'
              : 'bg-white text-black hover:bg-[#1BB6FF]'
          }`}
        >
          {marketAdded ? <Eye className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {marketAdded ? 'View market' : 'Add odds'}
        </button>
      </div>
    </article>
  )
}

function TeamBlock({ logo, name, align = 'left' }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center gap-3 ${align === 'right' ? 'justify-end' : ''}`}>
        {align === 'right' ? (
          <>
            <p className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">{name}</p>
            <TeamLogo logo={logo} name={name} />
          </>
        ) : (
          <>
            <TeamLogo logo={logo} name={name} />
            <p className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">{name}</p>
          </>
        )}
      </div>
    </div>
  )
}

function TeamLogo({ logo, name }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={`${name} logo`} className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1" />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-bold text-[#1BB6FF]">
      {String(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

export async function getServerSideProps(context) {
  try {
    requireAdmin(context.req)
    const supabase = getSupabaseAdmin()
    const dateKeys = {
      today: getDateKey(new Date()),
      tomorrow: getDateKey(new Date(), 1),
    }
    const initialPage = await loadAdminMatches(supabase, {
      search: queryValue(context.query.q),
      date: normalizeFilter(queryValue(context.query.date), DATE_FILTER_KEYS),
      status: normalizeFilter(queryValue(context.query.status), STATUS_FILTER_KEYS),
      page: 1,
      pageSize: PAGE_SIZE,
    })

    return {
      props: {
        initialPage,
        dateKeys,
        initialFilters: {
          q: queryValue(context.query.q),
          date: normalizeFilter(queryValue(context.query.date), DATE_FILTER_KEYS),
          status: normalizeFilter(queryValue(context.query.status), STATUS_FILTER_KEYS),
        },
      },
    }
  } catch (error) {
    if (error.statusCode === 401) {
      const nextPath = context.resolvedUrl || '/admin/select'
      return {
        redirect: {
          destination: `/admin?next=${encodeURIComponent(nextPath)}`,
          permanent: false,
        },
      }
    }

    console.log(error)
    return {
      props: {
        initialPage: {
          data: [],
          page: 1,
          pageSize: PAGE_SIZE,
          total: 0,
          hasMore: false,
        },
        dateKeys: {
          today: getDateKey(new Date()),
          tomorrow: getDateKey(new Date(), 1),
        },
        initialFilters: {
          q: '',
          date: 'all',
          status: 'all',
        },
      },
    }
  }
}
