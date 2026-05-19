import { supabase } from '../supabase'

/**
 * RPC Function Replacement: chan
 * Updates bet result status
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { bet, des } = req.body

    if (!bet || !des) {
      return res.status(400).json({ error: 'Missing required parameters: bet, des' })
    }

    // Validate des is either 'true' or 'false'
    if (des !== 'true' && des !== 'false') {
      return res.status(400).json({ error: 'Invalid des value. Must be "true" or "false"' })
    }

    // Update bet result
    const { error } = await supabase
      .from('placed')
      .update({ won: des })
      .eq('betid', bet)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `Bet ${bet} result updated to ${des}`
    })
  } catch (error) {
    console.error('Chan error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
