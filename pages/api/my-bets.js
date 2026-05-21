import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const { data: unsettled, error: unsettledError } = await supabase
      .from('placed')
      .select('*')
      .match({ username: profile.username, won: 'null' })

    if (unsettledError) throw unsettledError

    const { data: settled, error: settledError } = await supabase
      .from('placed')
      .select('*')
      .neq('won', 'null')
      .match({ username: profile.username })

    if (settledError) throw settledError

    return res.status(200).json({
      status: 'success',
      unsettled: unsettled || [],
      settled: settled || [],
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
