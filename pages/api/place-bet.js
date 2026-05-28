import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'
import { calculateVipLevel } from '@/lib/vip'

const markets = {
  nilnil: '0 - 0',
  onenil: '1 - 0',
  nilone: '0 - 1',
  oneone: '1 - 1',
  twonil: '2 - 0',
  niltwo: '0 - 2',
  twoone: '2 - 1',
  onetwo: '1 - 2',
  twotwo: '2 - 2',
  threenil: '3 - 0',
  nilthree: '0 - 3',
  threeone: '3 - 1',
  onethree: '1 - 3',
  twothree: '2 - 3',
  threetwo: '3 - 2',
  threethree: '3 - 3',
  otherscores: 'Other',
}

const vipOdds = {
  1: 0,
  2: 0.015,
  3: 0.03,
  4: 0.05,
  5: 0.07,
  6: 0.095,
  7: 0.125,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { match_id, picked, stake } = req.body || {}
    const amount = Number(stake)

    if (!match_id || !markets[picked] || !Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ status: 'error', message: 'Invalid bet details' })
    }

    const { profile, supabase } = await getCurrentProfile(
      req,
      'username,balance,totald,newrefer,refer,lvla,lvlb,gcount'
    )

    if (Number(profile.balance || 0) < amount) {
      return res.status(400).json({ status: 'error', message: 'You do not have Enough USDT to Complete this BET' })
    }

    if (Number(profile.gcount || 0) > 2) {
      return res.status(400).json({ status: 'error', message: 'You have reached the maximum number of bets for today' })
    }

    const { data: match, error: matchError } = await supabase
      .from('bets')
      .select('*')
      .eq('match_id', match_id)
      .maybeSingle()

    if (matchError) throw matchError
    if (!match) {
      return res.status(404).json({ status: 'error', message: 'Match not found' })
    }

    const matchStart = Number(match.tsgmt || 0) / 1000
    const now = Math.floor(Date.now() / 1000);

    //for development purposes
    // if (matchStart < now) {
    //   return res.status(400).json({ status: 'error', message: 'This Match has expired' })
    // }

    const { count, error: refError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .match({ refer: profile.newrefer, firstd: true })

    if (refError) throw refError

    const viplevel = calculateVipLevel(profile.totald || 0, count || 0)
    const odd = Number(match[picked] || 0) + (vipOdds[viplevel] || 0)
    const profit = Number(((odd * amount) / 100).toFixed(2))
    const newBalance = Number(profile.balance || 0) - amount

    const { error: balanceError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        gcount: Number(profile.gcount || 0) + 1,
      })
      .eq('username', profile.username)

    if (balanceError) throw balanceError

    const refer = profile.refer || ''
    const lvla = profile.lvla || ''
    const lvlb = profile.lvlb || ''

    const { error: betError } = await supabase
      .from('placed')
      .upsert({
        match_id: match.match_id,
        market: markets[picked],
        username: profile.username,
        started: false,
        stake: amount,
        profit,
        aim: profit,
        home: match.home,
        away: match.away,
        time: match.time,
        date: match.date,
        odd,
        ihome: match.ihome,
        iaway: match.iaway,
        levelone: refer.length < 2 ? 7705966 : refer,
        leveltwo: lvla.length < 2 ? 7705966 : lvla,
        levelthree: lvlb.length < 2 ? 7705966 : lvlb,
        aone: refer.length < 2 ? 0 : 0.05 * profit,
        atwo: lvla.length < 2 ? 0 : 0.03 * profit,
        athree: lvlb.length < 2 ? 0 : 0.01 * profit,
      })

    if (betError) throw betError

    await supabase.from('useractivity').upsert({
      type: 'bets',
      amount: amount + profit,
      user: profile.username,
      match_id: match.match_id,
      stake: amount,
      profit,
      market: markets[picked],
    })

    return res.status(200).json({
      status: 'success',
      message: 'Bet Successful',
      balance: newBalance,
    })
  } catch (error) {
    return sendApiError(res, error)
  }
}
