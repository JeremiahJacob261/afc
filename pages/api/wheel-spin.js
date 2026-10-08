import { randomInt } from 'node:crypto'
import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { sendPushToUsername } from '@/lib/pushNotifications'
import { WHEEL_INTERVAL_MS, WHEEL_MINIMUM_BALANCE } from '@/lib/wheel'

const ORIGINAL_PRIZES = ['iPhone 17', 'K5,000', 'K20,000', 'K100,000', 'K10', 'K500', 'K1,000', 'K30,000']

function nextSpinAt(spunAt) {
  return spunAt ? new Date(new Date(spunAt).getTime() + WHEEL_INTERVAL_MS).toISOString() : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 'no-store')
  try {
    const { user, profile, supabase } = await getCurrentProfile(req, 'userid,username,balance')
    const { data: wheel, error: wheelError } = await supabase.rpc('read_wheel_configuration')
    if (wheelError) throw wheelError
    if (!wheel || !Array.isArray(wheel.items) || wheel.items.length < 2) throw new Error('Wheel items are unavailable')

    if (req.method === 'GET') {
      const { data: current, error } = await supabase.from('wheel_spin_state')
        .select('spun_at,prize_index,prize_label,prize_amount').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      const availableAt = nextSpinAt(current?.spun_at)
      const balance = Number(profile.balance || 0)
      const eligible = balance >= WHEEL_MINIMUM_BALANCE
      return res.status(200).json({
        status: 'success', balance, minimumBalance: WHEEL_MINIMUM_BALANCE, eligible,
        canSpin: eligible && (!availableAt || Date.now() >= Date.parse(availableAt)),
        nextSpinAt: availableAt,
        lastPrize: current ? current.prize_label || ORIGINAL_PRIZES[current.prize_index] || null : null,
        lastAmount: current?.prize_amount ?? null,
        revision: wheel.revision, items: wheel.items,
      })
    }

    const revision = req.body?.revision
    if (!Number.isSafeInteger(revision) || revision < 1) {
      return res.status(400).json({ status: 'error', message: 'Invalid wheel revision' })
    }
    // The database resolves the amount from this index under the configuration lock.
    const { data: result, error } = await supabase.rpc('spin_wheel_atomic', {
      p_user_id: user.id, p_expected_revision: revision, p_prize_index: randomInt(wheel.items.length),
    })
    if (error) throw error
    if (!result) throw new Error('Missing spin result')
    if (result.status === 'insufficient_balance') return res.status(403).json(result)
    if (result.status === 'cooldown' || result.status === 'wheel_updated') return res.status(409).json(result)
    if (result.status !== 'success') throw new Error('Invalid spin result')

    const { notification, ...award } = result
    // The in-app notification already committed with the award. Never insert it again.
    try {
      await sendPushToUsername(supabase, notification.username, {
        title: notification.title, body: notification.body,
        data: { ...notification.data, eventType: 'wheel_reward', notificationId: notification.id },
      })
    } catch (pushError) {
      console.warn('Wheel reward push delivery failed:', pushError.message)
    }
    return res.status(200).json(award)
  } catch (error) {
    return sendApiError(res, error)
  }
}
