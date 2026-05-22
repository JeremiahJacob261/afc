import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * RPC Function Replacement: gatherw
 * Adds amount to user's total withdrawal counter
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { names, amount } = req.body

    if (!names || amount === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: names, amount' })
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('totalw')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('Fetch error:', fetchErr)
      return res.status(404).json({ error: 'User not found' })
    }

    const amountNum = parseFloat(amount)
    const newTotalw = Number(user.totalw || 0) + amountNum

    const { error } = await supabase
      .from('users')
      .update({ totalw: newTotalw })
      .eq('username', names)

    if (error) throw error

    res.status(200).json({
      status: 'success',
      message: `Total withdrawals increased by ${amount} for user ${names}`,
      newTotalw,
    })
  } catch (error) {
    console.error('Gatherw error:', error)
    return sendApiError(res, error)
  }
}
