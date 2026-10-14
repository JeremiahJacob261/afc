import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { withApiTiming, timedRpc } from '@/lib/apiTiming'
import { cursorPage, decodeCursor, encodeCursor, pageSize } from '@/lib/pagination'
import { isActiveMember } from '@/lib/membership'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  try {
    const user = await getCurrentUser(req)
    const paged = req.query?.page === '1', limit = pageSize(req.query?.limit, 20)
    const { data, error } = await timedRpc(req, getSupabaseAdmin(), 'read_referral_history', {
      p_userid: user.id, p_limit: paged ? limit + 1 : 1000, p_cursor: decodeCursor(req.query?.cursor),
    })
    if (error) throw error
    const next = {}, seen = new Set(), referrals = []
    for (const [index, column] of ['refer', 'lvla', 'lvlb'].entries()) {
      const page = paged ? cursorPage(data.levels[column], limit) : { data: data.levels[column] }
      next[column] = page.next
      for (const row of page.data) {
        if (seen.has(row.id)) continue
        seen.add(row.id)
        referrals.push({ ...row, key: row.id, totald: Number(row.totald || 0), balance: Number(row.balance || 0),
          firstd: Boolean(row.firstd), isActive: isActiveMember(row.balance, data.membershipBalanceThreshold),
          joinedAt: row.created_at, level: index + 1, levelLabel: `Level ${index + 1}` })
      }
    }
    return res.status(200).json({ status: 'success', refer: data.refer, referrals,
      membershipBalanceThreshold: data.membershipBalanceThreshold,
      ...(paged ? { nextCursor: Object.values(next).some(Boolean) ? encodeCursor(next) : null } : {}),
    })
  } catch (error) { return sendApiError(res, error) }
})
