import { supabase } from '../supabase'

/**
 * RPC Function Replacement: dailywl
 * Tracks daily withdrawal limit by incrementing the dailywl field
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

    // Fetch current daily withdrawal
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('dailywl')
      .eq('username', names)
      .single()

    if (fetchErr) {
      console.error('Fetch error:', fetchErr)
      return res.status(404).json({ error: 'User not found' })
    }

    const amountNum = parseFloat(amount)
    const newDailywl = user.dailywl + amountNum

    // Increment daily withdrawal limit tracker
    const { error } = await supabase
      .from('users')
      .update({ dailywl: newDailywl })
      .eq('username', names)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `Daily withdrawal limit updated by ${amount} for user ${names}`,
      newDailywl
    })
  } catch (error) {
    console.error('Daily withdrawal limit error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
