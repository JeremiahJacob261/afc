import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getFirstDepositBonusPercent,
  saveFirstDepositBonusPercent,
} from '@/lib/adminSettings'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const firstDepositBonusPercent = await getFirstDepositBonusPercent(supabase, {
        allowDefaultOnMissingTable: true,
      })
      return res.status(200).json({ status: 'success', settings: { firstDepositBonusPercent } })
    }

    if (req.method === 'PUT') {
      const firstDepositBonusPercent = await saveFirstDepositBonusPercent(
        supabase,
        req.body?.firstDepositBonusPercent
      )
      return res.status(200).json({ status: 'success', settings: { firstDepositBonusPercent } })
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin settings error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
