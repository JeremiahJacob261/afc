import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * RPC Function Replacement: increment
 * Increases VIP level for a user
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { x, row_id } = req.body

    if (x === undefined || !row_id) {
      return res.status(400).json({ error: 'Missing required parameters: x, row_id' })
    }

    // Get current VIP level
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('viplevel')
      .eq('id', row_id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return res.status(404).json({ error: 'User not found' })
    }

    const incrementNum = parseInt(x)
    const newVipLevel = Math.min(userData.viplevel + incrementNum, 7) // Cap at level 7

    // Update VIP level
    const { error } = await supabase
      .from('users')
      .update({ viplevel: newVipLevel })
      .eq('id', row_id)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({
      status: 'success',
      message: `VIP level incremented by ${x} for user ID ${row_id}. New level: ${newVipLevel}`
    })
  } catch (error) {
    console.error('Increment error:', error)
    return sendApiError(res, error)
  }
}
