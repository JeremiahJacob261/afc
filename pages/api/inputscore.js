import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { settleReverseMatch } from '@/lib/reverseSettlement'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' })
  }

  try {
    const { home, away, matchid } = req.body || {}
    if (!matchid) {
      return res.status(400).json({ status: 'error', message: 'Missing match id' })
    }

    const result = await settleReverseMatch({
      req,
      supabase: getSupabaseAdmin(),
      matchid,
      home,
      away,
    })

    return res.status(200).json(result)
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Unable to settle match' : error.message
    console.error('Input score settlement error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
