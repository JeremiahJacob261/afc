import { supabase } from '../supabase'

/**
 * RPC Function Replacement: affbonus
 * Distributes 3-tier affiliate commissions: 6% to L1, 3% to L2, 1% to L3
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, type, amount, refers, lvls, lvlss } = req.body

    if (!name || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters: name, amount'
      })
    }

    const baseAmount = parseFloat(amount)
    const results = {}

    // Level 1: 6% to direct referrer
    if (refers && refers !== 'null') {
      const l1Bonus = baseAmount * 0.06

      // Get the user with this referrer code
      const { data: referrer, error: refErr } = await supabase
        .from('users')
        .select('username, balance')
        .eq('newrefer', refers)
        .single()

      if (!refErr && referrer) {
        // Update referrer balance
        const newBalance = referrer.balance + l1Bonus
        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('newrefer', refers)

        // Log to activity
        await supabase.from('activa').insert({
          code: refers,
          username: referrer.username,
          amount: l1Bonus,
          type: 'affbonus'
        })

        results.level1 = `6% (${l1Bonus.toFixed(4)}) to ${referrer.username}`
      }
    }

    // Level 2: 3% to second-tier referrer
    if (lvls && lvls !== 'null') {
      const l2Bonus = baseAmount * 0.03

      // Get the user with this referrer code
      const { data: referrer2, error: ref2Err } = await supabase
        .from('users')
        .select('username, balance')
        .eq('newrefer', lvls)
        .single()

      if (!ref2Err && referrer2) {
        // Update referrer balance
        const newBalance = referrer2.balance + l2Bonus
        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('newrefer', lvls)

        // Log to activity
        await supabase.from('activa').insert({
          code: lvls,
          username: referrer2.username,
          amount: l2Bonus,
          type: 'affbonus'
        })

        results.level2 = `3% (${l2Bonus.toFixed(4)}) to ${referrer2.username}`
      }
    }

    // Level 3: 1% to third-tier referrer
    if (lvlss && lvlss !== 'null') {
      const l3Bonus = baseAmount * 0.01

      // Get the user with this referrer code
      const { data: referrer3, error: ref3Err } = await supabase
        .from('users')
        .select('username, balance')
        .eq('newrefer', lvlss)
        .single()

      if (!ref3Err && referrer3) {
        // Update referrer balance
        const newBalance = referrer3.balance + l3Bonus
        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('newrefer', lvlss)

        // Log to activity
        await supabase.from('activa').insert({
          code: lvlss,
          username: referrer3.username,
          amount: l3Bonus,
          type: 'affbonus'
        })

        results.level3 = `1% (${l3Bonus.toFixed(4)}) to ${referrer3.username}`
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Affiliate bonuses distributed for ${name}`,
      breakdown: results
    })
  } catch (error) {
    console.error('Affbonus error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
