import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

const typeMap = {
  all: null,
  deposit: 'deposit',
  withdraw: 'withdraw',
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username,totald,totalw')
    const filter = typeMap[req.query.type || 'all']
    let query = supabase
      .from('notification')
      .select('*')
      .eq('username', profile.username)
      .order('id', { ascending: false })

    if (filter) {
      query = query.eq('type', filter)
    }

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json({
      status: 'success',
      data: data || [],
      user: profile,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
