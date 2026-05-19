import { supabase } from '../supabase'

/**
 * RPC Function Replacement: withdrawer
 * Deducts withdrawal amount from user's balance
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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

    if (user.balance < amountNum) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance for withdrawal'
      })
    }

    const newBalance = user.balance - amountNum

    // Deduct from balance
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('username', names)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `Withdrawn ${amount} from user ${names}`,
      newBalance
    })
  } catch (error) {
    console.error('Withdrawer error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
