import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Missing required parameter: name' })
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('deposit')
      .eq('username', name)
      .single()

    if (fetchErr) {
      return res.status(404).json({ error: 'User not found' })
    }

    const nextDepositCount = Number(user.deposit || 0) + 1
    const { error } = await supabase
      .from('users')
      .update({ deposit: nextDepositCount })
      .eq('username', name)

    if (error) throw error

    return res.status(200).json({ status: 'success', deposit: nextDepositCount })
  } catch (error) {
    console.error('Deposits error:', error)
    return sendApiError(res, error)
  }
}
