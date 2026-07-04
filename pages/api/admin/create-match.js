import { requireAdmin } from '@/lib/adminAuth'
import { notifyCompanyMatchPosted } from '@/lib/pushNotifications'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value
  return ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const input = req.body || {}
    const matchId = String(input.match_id || '').trim()
    if (!matchId) {
      return res.status(400).json({ status: 'error', message: 'Missing match id' })
    }

    const supabase = getSupabaseAdmin()
    const { data: existing, error: existingError } = await supabase
      .from('bets')
      .select('match_id')
      .eq('match_id', matchId)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Bet already uploaded, please check your bets to edit' })
    }

    const payload = {
      ...input,
      match_id: matchId,
      company: normalizeBoolean(input.company),
      tsgmt: Number(input.tsgmt || 0) || null,
    }

    const { data: match, error: insertError } = await supabase
      .from('bets')
      .insert(payload)
      .select('*')
      .single()

    if (insertError) throw insertError

    if (match?.company) {
      try {
        await notifyCompanyMatchPosted(supabase, match)
      } catch (pushError) {
        console.warn('Company match push notification failed:', pushError)
      }
    }

    return res.status(200).json({ status: 'success', match })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    return res.status(status).json({ status: 'error', message })
  }
}
