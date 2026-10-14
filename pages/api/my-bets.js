import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { cursorPage, decodeCursor, encodeCursor, pageSize } from '@/lib/pagination'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  try {
    const user = await getCurrentUser(req)
    const summary = req.query?.summary === '1', paged = req.query?.page === '1'
    const limit = summary ? 5 : pageSize(req.query?.limit)
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'read_bet_history', {
      p_userid: user.id, p_summary: summary, p_limit: summary || paged ? limit + 1 : 1000,
      p_cursor: decodeCursor(req.query?.cursor),
    })
    if (error) throw error
    const open = summary || paged ? cursorPage(data.unsettled, limit) : { data: data.unsettled }
    const settled = paged ? cursorPage(data.settled, limit) : { data: data.settled }
    const next = { unsettled: open.next, settled: settled.next }
    return res.status(200).json({ status: 'success', unsettled: open.data, settled: settled.data,
      ...(summary ? { totalUnsettled: data.totalUnsettled || 0 } : {}),
      ...(paged ? { nextCursor: Object.values(next).some(Boolean) ? encodeCursor(next) : null } : {}),
    })
  } catch (error) { return sendApiError(res, error) }
})
