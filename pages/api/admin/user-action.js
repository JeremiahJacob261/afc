import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const { action, username, newBalance, currentRefer, newRefer } = req.body || {}
    const supabase = getSupabaseAdmin()

    if (action === 'update-balance') {
      const amount = Number(newBalance)
      if (!username || !Number.isFinite(amount)) {
        return res.status(400).json({ status: 'error', message: 'Invalid balance update' })
      }

      const { error } = await supabase
        .from('users')
        .update({ balance: amount })
        .eq('username', username)

      if (error) throw error
      return res.status(200).json({ status: 'success' })
    }

    if (action === 'delete-wallet') {
      if (!username) {
        return res.status(400).json({ status: 'error', message: 'Missing username' })
      }

      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('username', username)

      if (error) throw error
      return res.status(200).json({ status: 'success' })
    }

    if (action === 'switch-referral') {
      if (!currentRefer || !newRefer) {
        return res.status(400).json({ status: 'error', message: 'Missing referral details' })
      }

      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('refer,lvla')
        .eq('newrefer', newRefer)
        .maybeSingle()

      if (referrerError) throw referrerError
      if (!referrer) {
        return res.status(404).json({ status: 'error', message: 'New referrer not found' })
      }

      const { error } = await supabase
        .from('users')
        .update({ refer: newRefer, lvla: referrer.refer ?? 0, lvlb: referrer.lvla ?? 0 })
        .eq('newrefer', currentRefer)

      if (error) throw error
      return res.status(200).json({ status: 'success' })
    }

    return res.status(400).json({ status: 'error', message: 'Unsupported admin action' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin user action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
