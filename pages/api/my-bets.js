import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

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
    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const { data: unsettled, error: unsettledError } = await supabase
      .from('placed')
      .select('*')
      .match({ username: profile.username, won: 'null' })

    if (unsettledError) throw unsettledError

    const { data: settled, error: settledError } = await supabase
      .from('placed')
      .select('*')
      .neq('won', 'null')
      .match({ username: profile.username })

    if (settledError) throw settledError

    const [unsettledWithStarts, settledWithStarts] = await Promise.all([
      attachMatchStarts(supabase, unsettled || []),
      attachMatchStarts(supabase, settled || []),
    ])

    return res.status(200).json({
      status: 'success',
      unsettled: unsettledWithStarts,
      settled: settledWithStarts,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
