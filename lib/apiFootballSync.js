const API_FOOTBALL_KEY = 'c1dcc11c15bcbe4151733db267ff686a'
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'
const DISPLAY_TIME_ZONE = 'Africa/Lagos'
const UPCOMING_MATCH_DAYS = 2

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatUtcDate(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-')
}

function addUtcDays(date, days) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + days
  ))
}

export function getFixtureWindowDates(now = new Date()) {
  return Array.from({ length: UPCOMING_MATCH_DAYS }, (_, index) => {
    return formatUtcDate(addUtcDays(now, index))
  })
}

function normalizeStoredDate(row) {
  if (row?.timest) {
    const date = new Date(row.timest)
    if (!Number.isNaN(date.getTime())) {
      return formatUtcDate(date)
    }
  }

  if (row?.date) {
    const [year, month, day] = String(row.date).slice(0, 10).split('-')
    if (year && month && day) {
      return `${year}-${pad(month)}-${pad(day)}`
    }
  }

  return ''
}

function shouldRefreshUpcomingMatches(rows, allowedDates = getFixtureWindowDates()) {
  if (!rows?.length) return true

  const allowed = new Set(allowedDates)
  return rows.some((row) => !allowed.has(normalizeStoredDate(row)))
}

function getDisplayDateParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  return formatter.formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value
    return parts
  }, {})
}

function normalizeFixture(fixtureData) {
  const fixture = fixtureData.fixture || {}
  const kickoff = fixture.date
    ? new Date(fixture.date)
    : new Date(Number(fixture.timestamp || 0) * 1000)

  if (!fixture.id || Number.isNaN(kickoff.getTime())) return null

  const teams = fixtureData.teams || {}
  const home = teams.home || {}
  const away = teams.away || {}
  const league = fixtureData.league || {}
  const parts = getDisplayDateParts(kickoff)

  return {
    id: fixture.id,
    league: [league.country, league.name].filter(Boolean).join(' '),
    home_name: home.name || '',
    away_name: away.name || '',
    home_logo: home.logo || '',
    away_logo: away.logo || '',
    hour: parts.hour,
    minute: parts.minute,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    day: Number(parts.day),
    month: Number(parts.month),
    timest: kickoff.toISOString(),
  }
}

async function fetchFixturesByDate(date) {
  const params = new URLSearchParams({
    date,
    status: 'NS',
  })

  const response = await fetch(`${API_FOOTBALL_BASE_URL}/fixtures?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'x-apisports-key': API_FOOTBALL_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`API-Football fixtures request failed for ${date}: ${response.status}`)
  }

  const payload = await response.json()
  const errors = payload?.errors
  const hasErrors = Array.isArray(errors) ? errors.length > 0 : !!errors && Object.keys(errors).length > 0

  if (hasErrors) {
    throw new Error(`API-Football returned an error for ${date}: ${JSON.stringify(errors)}`)
  }

  return Array.isArray(payload?.response) ? payload.response : []
}

async function replaceUpcomingMatches(supabase, matches) {
  const { error: deleteError } = await supabase
    .from('upcoming_matches')
    .delete()
    .not('id', 'is', null)

  if (deleteError) throw deleteError
  if (!matches.length) return

  const chunkSize = 500
  for (let index = 0; index < matches.length; index += chunkSize) {
    const chunk = matches.slice(index, index + chunkSize)
    const { error } = await supabase
      .from('upcoming_matches')
      .insert(chunk)

    if (error) throw error
  }
}

export async function refreshUpcomingMatches(supabase, now = new Date()) {
  const dates = getFixtureWindowDates(now)
  const fixturesByDate = await Promise.all(dates.map(fetchFixturesByDate))
  const byId = new Map()

  fixturesByDate
    .flat()
    .map(normalizeFixture)
    .filter(Boolean)
    .forEach((match) => byId.set(match.id, match))

  const matches = Array.from(byId.values())
    .sort((a, b) => new Date(a.timest).getTime() - new Date(b.timest).getTime())

  await replaceUpcomingMatches(supabase, matches)

  return {
    dates,
    refreshed: true,
    count: matches.length,
  }
}

export async function ensureUpcomingMatchesCurrent(supabase, now = new Date()) {
  const { data, error } = await supabase
    .from('upcoming_matches')
    .select('id,date,timest')
    .limit(1000)

  if (error) throw error

  const dates = getFixtureWindowDates(now)
  if (!shouldRefreshUpcomingMatches(data || [], dates)) {
    return {
      dates,
      refreshed: false,
      count: data?.length || 0,
    }
  }

  return refreshUpcomingMatches(supabase, now)
}
