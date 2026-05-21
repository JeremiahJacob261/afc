import { sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

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
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', username)
      .maybeSingle();



    if (error) throw error
    if (!data?.email) {
      return res.status(404).json({ status: 'error', message: 'Invalid login credentials' })
    }

    return res.status(200).json({ status: 'success', email: data.email });
  } catch (error) {
    return sendApiError(res, error);
  }
}
