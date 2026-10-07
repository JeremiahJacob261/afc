import { randomInt } from 'node:crypto'
import { getCurrentUser, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const SPIN_INTERVAL_MS = 24 * 60 * 60 * 1000
const PRIZES = ['iPhone 17', 'K5,000', 'K20,000', 'K100,000', 'K10', 'K500', 'K1,000', 'K30,000']

function nextSpinAt(spunAt) {
  return spunAt ? new Date(new Date(spunAt).getTime() + SPIN_INTERVAL_MS).toISOString() : null
}

async function getSpinState(supabase, userId) {
  const { data, error } = await supabase.from('wheel_spin_state')
    .select('spun_at,prize_index').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store')
  try {
    const user = await getCurrentUser(req)
    const supabase = getSupabaseAdmin()
    const current = await getSpinState(supabase, user.id)
    const availableAt = nextSpinAt(current?.spun_at)

    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'success',
        canSpin: !availableAt || Date.now() >= Date.parse(availableAt),
        nextSpinAt: availableAt,
        lastPrize: current ? PRIZES[current.prize_index] : null,
      })
    }

    if (availableAt && Date.now() < Date.parse(availableAt)) {
      return res.status(409).json({ status: 'cooldown', message: 'You can spin again after 24 hours.', nextSpinAt: availableAt })
    }

    const prizeIndex = randomInt(PRIZES.length)
    const now = new Date()
    const cutoff = new Date(now.getTime() - SPIN_INTERVAL_MS).toISOString()
    let saved = null

    if (current) {
      const { data, error } = await supabase.from('wheel_spin_state')
        .update({ spun_at: now.toISOString(), prize_index: prizeIndex })
        .eq('user_id', user.id).lte('spun_at', cutoff)
        .select('spun_at,prize_index').maybeSingle()
      if (error) throw error
      saved = data
    } else {
      const { data, error } = await supabase.from('wheel_spin_state')
        .insert({ user_id: user.id, spun_at: now.toISOString(), prize_index: prizeIndex })
        .select('spun_at,prize_index').single()
      if (error && error.code !== '23505') throw error
      saved = data
    }

    if (!saved) {
      const latest = await getSpinState(supabase, user.id)
      return res.status(409).json({ status: 'cooldown', message: 'You can spin again after 24 hours.', nextSpinAt: nextSpinAt(latest?.spun_at) })
    }

    return res.status(200).json({
      status: 'success',
      prizeIndex: saved.prize_index,
      prize: PRIZES[saved.prize_index],
      nextSpinAt: nextSpinAt(saved.spun_at),
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
