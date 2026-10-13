import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { applyCursor, cursorPage, decodeCursor, encodeCursor, pageSize } from '@/lib/pagination'

async function attachMatchStarts(supabase, rows = []) {
  const matchIds = [...new Set(rows.map((row) => row.match_id).filter(Boolean))]
  if (!matchIds.length) return rows

  const { data: matches, error } = await supabase
    .from('bets')
    .select('match_id,tsgmt,date,time')
    .in('match_id', matchIds)

  if (error) throw error

  const matchById = new Map((matches || []).map((match) => [match.match_id, match]))
  return rows.map((row) => {
    const match = matchById.get(row.match_id)
    if (!match) return row

    return {
      ...row,
      tsgmt: match.tsgmt,
      match_date: match.date,
      match_time: match.time,
    }
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    res.setHeader('Cache-Control', 'private, no-store')
    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const summary = req.query?.summary === '1'
    const paged = req.query?.page === '1'
    const limit = summary ? 5 : pageSize(req.query?.limit)
    const cursor = decodeCursor(req.query?.cursor)
    const unsettledQuery = supabase
      .from('placed')
      .select('*', { count: summary ? 'exact' : undefined })
      .match({ username: profile.username, won: 'null' })
    const settledQuery = supabase
      .from('placed')
      .select('*')
      .neq('won', 'null')
      .match({ username: profile.username })
    const results = await Promise.all([
      summary || paged ? applyCursor(unsettledQuery, cursor, 'unsettled', limit) : unsettledQuery,
      summary ? Promise.resolve({ data: [], error: null }) : paged ? applyCursor(settledQuery, cursor, 'settled', limit) : settledQuery,
    ])
    results.forEach(result => { if (result.error) throw result.error })
    const unsettledPage = summary || paged ? cursorPage(results[0].data || [], limit) : { data: results[0].data || [] }
    const settledPage = paged ? cursorPage(results[1].data || [], limit) : { data: results[1].data || [] }
    const rows = await attachMatchStarts(supabase, [...unsettledPage.data, ...settledPage.data])
    const next = { unsettled: unsettledPage.next, settled: settledPage.next }

    return res.status(200).json({
      status: 'success',
      unsettled: rows.slice(0, unsettledPage.data.length),
      ...(summary ? { totalUnsettled: results[0].count || 0 } : {}),
      settled: rows.slice(unsettledPage.data.length),
      ...(paged ? { nextCursor: Object.values(next).some(Boolean) ? encodeCursor(next) : null } : {}),
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
