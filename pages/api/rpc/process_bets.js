import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

/**
 * RPC Function Replacement: process_bets
 * Core bet processing engine - settles pending bets for a user
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username')
    const name = profile.username

    if (!name) {
      return res.status(400).json({ error: 'Missing current profile username' })
    }

    // Get all pending bets for the user
    const { data: pendingBets, error: betsError } = await supabase
      .from('placed')
      .select('*')
      .eq('username', name)
      .eq('won', 'null')

    if (betsError) throw betsError

    if (!pendingBets || pendingBets.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: `No pending bets to process for ${name}`,
        processed: 0,
        total: 0
      })
    }

    // Get user's referral chain
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('refer, lvla, lvlb, balance, totald')
      .eq('username', name)
      .single()

    if (userError) throw userError

    let processedCount = 0
    const errors = []

    // Process each pending bet
    for (const bet of pendingBets) {
      try {
        // Determine if bet was won (profit > 0 indicates a win)
        const betWon = bet.profit > 0

        if (betWon) {
          // Deposit stake + winnings to user
          const totalReturn = parseFloat(bet.stake) + parseFloat(bet.aim)
          const newBalance = userData.balance + totalReturn
          const newTotald = userData.totald + totalReturn

          // Update user balance
          const { error: depError } = await supabase
            .from('users')
            .update({
              balance: newBalance,
              totald: newTotald
            })
            .eq('username', name)

          if (depError) throw depError

          // Mark bet as won
          const { error: chanError } = await supabase
            .from('placed')
            .update({ won: 'true' })
            .eq('betid', bet.betid)

          if (chanError) throw chanError

          // Distribute affiliate bonuses
          if (userData.refer && userData.refer !== 'null') {
            const l1Bonus = bet.profit * 0.06
            const l2Bonus = bet.profit * 0.03
            const l3Bonus = bet.profit * 0.01

            // L1 bonus
            const { data: ref1 } = await supabase
              .from('users')
              .select('balance')
              .eq('newrefer', userData.refer)
              .single()

            if (ref1) {
              await supabase
                .from('users')
                .update({ balance: ref1.balance + l1Bonus })
                .eq('newrefer', userData.refer)

              await supabase.from('activa').insert({
                code: userData.refer,
                username: userData.refer,
                amount: l1Bonus,
                type: 'affbonus'
              })
            }

            // L2 bonus
            if (userData.lvla && userData.lvla !== 'null') {
              const { data: ref2 } = await supabase
                .from('users')
                .select('balance')
                .eq('newrefer', userData.lvla)
                .single()

              if (ref2) {
                await supabase
                  .from('users')
                  .update({ balance: ref2.balance + l2Bonus })
                  .eq('newrefer', userData.lvla)

                await supabase.from('activa').insert({
                  code: userData.lvla,
                  username: userData.lvla,
                  amount: l2Bonus,
                  type: 'affbonus'
                })
              }
            }

            // L3 bonus
            if (userData.lvlb && userData.lvlb !== 'null') {
              const { data: ref3 } = await supabase
                .from('users')
                .select('balance')
                .eq('newrefer', userData.lvlb)
                .single()

              if (ref3) {
                await supabase
                  .from('users')
                  .update({ balance: ref3.balance + l3Bonus })
                  .eq('newrefer', userData.lvlb)

                await supabase.from('activa').insert({
                  code: userData.lvlb,
                  username: userData.lvlb,
                  amount: l3Bonus,
                  type: 'affbonus'
                })
              }
            }
          }
        } else {
          // Bet was lost - just mark as lost
          const { error: chanError } = await supabase
            .from('placed')
            .update({ won: 'false' })
            .eq('betid', bet.betid)

          if (chanError) throw chanError

          // Log loss to activity table
          await supabase.from('activa').insert({
            code: 'bet_loss',
            username: name,
            amount: parseFloat(bet.stake),
            type: 'lost_bet'
          })
        }

        processedCount++
      } catch (err) {
        console.error(`Error processing bet ${bet.betid}:`, err)
        errors.push({
          betid: bet.betid,
          error: err.message
        })
        continue
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Processed ${processedCount} bets for ${name}`,
      processed: processedCount,
      total: pendingBets.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Process bets error:', error)
    return sendApiError(res, error)
  }
}
