import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * RPC Function Replacement: gatherd
 * Adds amount to user's total deposit counter
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

    // Fetch current total deposits
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('totald')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('Fetch error:', fetchErr)
      return res.status(404).json({ error: 'User not found' })
    }

    const amountNum = parseFloat(amount)
    const newTotald = Number(user.totald || 0) + amountNum

    // Increment total deposits
    const { error } = await supabase
      .from('users')
      .update({ totald: newTotald })
      .eq('username', names)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `Total deposits increased by ${amount} for user ${names}`,
      newTotald
    })
  } catch (error) {
    console.error('Gatherd error:', error)
    return sendApiError(res, error)
  }
}
