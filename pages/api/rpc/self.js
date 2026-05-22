import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { name, amount } = req.body
    const amountNum = Number(amount)

    if (!name || !Number.isFinite(amountNum)) {
      return res.status(400).json({ error: 'Missing required parameters: name, amount' })
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('balance')
      .eq('username', name)
      .single()

    if (fetchErr) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newBalance = Number(user.balance || 0) + amountNum
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('username', name)

    if (error) throw error

    return res.status(200).json({ status: 'success', newBalance })
  } catch (error) {
    console.error('Self error:', error)
    return sendApiError(res, error)
  }
}
