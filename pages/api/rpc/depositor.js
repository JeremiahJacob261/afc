import { supabase } from '../supabase'

/**
 * RPC Function Replacement: depositor
 * Adds deposit amount to user's balance and total deposits
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

    // Fetch current user balance and totald
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('balance, totald')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('Fetch error:', fetchErr)
      return res.status(404).json({ error: 'User not found' })
    }

    const newBalance = user.balance + parseFloat(amount)
    const newTotald = user.totald + parseFloat(amount)

    // Update user balance and total deposits
    const { error } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        totald: newTotald
      })
      .eq('username', names)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `Deposited ${amount} to user ${names}`,
      newBalance,
      newTotald
    })
  } catch (error) {
    console.error('Depositor error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
