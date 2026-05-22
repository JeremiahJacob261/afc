import { requireInternalSecret, sendApiError } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    requireInternalSecret(req)
    const supabase = getSupabaseAdmin()
    const { amount, name, refers } = req.body
    const amountNum = Number(amount)

    if (!name || !Number.isFinite(amountNum)) {
      return res.status(400).json({ error: 'Missing required parameters: name, amount' })
    }

    if (refers && refers !== 'null') {
      const { data: referrer, error: refErr } = await supabase
        .from('users')
        .select('balance')
        .eq('newrefer', refers)
        .maybeSingle()

      if (refErr) throw refErr

      if (referrer) {
        const bonus = amountNum * 0.05
        const { error: updateErr } = await supabase
          .from('users')
          .update({ balance: Number(referrer.balance || 0) + bonus })
          .eq('newrefer', refers)

        if (updateErr) throw updateErr

        const { error: activityErr } = await supabase
          .from('activa')
          .insert({ username: name, type: 'depbonus', amount: bonus, code: refers })

        if (activityErr) throw activityErr
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ firstd: true })
      .eq('username', name)

    if (error) throw error

    return res.status(200).json({ status: 'success' })
  } catch (error) {
    console.error('Refbonus error:', error)
    return sendApiError(res, error)
  }
}
