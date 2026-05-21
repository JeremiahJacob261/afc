import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * RPC Function Replacement: gatherd
 * Deducts amount from user balance (admin collection)
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

    // Fetch current balance
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('balance')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('Fetch error:', fetchErr)
      return res.status(404).json({ error: 'User not found' })
    }

    const amountNum = parseFloat(amount)
    const newBalance = user.balance - amountNum

    // Deduct amount from balance
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('username', names)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    // Log the activity
    await supabase
      .from('activa')
      .insert({
        code: 'gatherd',
        username: names,
        amount: amountNum,
        type: 'admin_collection'
      })

    res.status(200).json({
      status: 'success',
      message: `Gathered ${amount} from user ${names}`,
      newBalance
    })
  } catch (error) {
    console.error('Gatherd error:', error)
    return sendApiError(res, error)
  }
}
