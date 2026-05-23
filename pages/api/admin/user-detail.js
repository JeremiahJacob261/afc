import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const uid = String(req.query.uid || '').trim()
    if (!uid) {
      return res.status(400).json({ status: 'error', message: 'Missing user id' })
    }

    const supabase = getSupabaseAdmin()
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('newrefer,username,email,uid,phone,countrycode,refer,lvla,lvlb,password,balance,totald')
      .eq('uid', uid)

    if (userError) throw userError
    const user = users?.[0]
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    const [{ data: referrals, error: referralError }, { data: bets, error: betsError }, { data: referredBy, error: referredByError }] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .or(`refer.eq.${user.newrefer},lvla.eq.${user.newrefer},lvlb.eq.${user.newrefer}`),
      supabase
        .from('placed')
        .select('*')
        .eq('username', user.username),
      supabase
        .from('users')
        .select('username')
        .eq('newrefer', user.refer),
    ])

    if (referralError) throw referralError
    if (betsError) throw betsError
    if (referredByError) throw referredByError

    return res.status(200).json({
      status: 'success',
      user,
      referusers: referrals?.length || 0,
      bets: bets || [],
      wonbet: (bets || []).filter((bet) => bet.won === 'true'),
      lostbet: (bets || []).filter((bet) => bet.won === 'false'),
      referredby: referredBy?.[0]?.username || 'None',
    })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin user detail error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
