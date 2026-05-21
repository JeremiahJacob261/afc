import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const username = String(req.body?.username || '').trim()
    if (!username) {
      return res.status(400).json({ status: 'error', message: 'Username is required' })
    }

    const supabase = getSupabaseAdmin()
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)

    if (error) throw error

    return res.status(200).json({
      status: 'success',
      available: (count || 0) === 0,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
