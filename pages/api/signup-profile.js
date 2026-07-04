import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApiError } from '@/lib/apiAuth'
import { notifyTeamMemberJoined } from '@/lib/pushNotifications'

function generateUid() {
  return `uid_${Math.random().toString(36).slice(2, 12)}`
}

function generateReferralCode() {
  return String(Math.floor(Math.random() * 9000000) + 1000000)
}

async function getUniqueReferralCode(supabase) {
  for (let i = 0; i < 10; i++) {
    const newrefer = generateReferralCode()
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('newrefer', newrefer)
      .maybeSingle()

    if (error) throw error
    if (!data) return newrefer
  }

  throw new Error('Unable to generate a unique referral code')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const userid = String(body.userid || '').trim()
    const username = String(body.username || '').trim()
    const email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const countrycode = String(body.countrycode || '+1').trim()
    const referCode = String(body.refer || '').trim()

    if (!userid || !username || !email) {
      return res.status(400).json({ status: 'error', message: 'Missing required signup fields' })
    }

    const supabase = getSupabaseAdmin()

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('userid', userid)
      .maybeSingle()

    if (existingUserError) throw existingUserError
    if (existingUser) {
      return res.status(200).json({ status: 'success', message: 'Profile already exists' })
    }

    const { count, error: usernameError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)

    if (usernameError) throw usernameError
    if ((count || 0) > 0) {
      return res.status(409).json({ status: 'error', message: 'Username Already Exist!' })
    }

    let lvla = ''
    let lvlb = ''

    if (referCode) {
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('refer,lvla')
        .eq('newrefer', referCode)
        .maybeSingle()

      if (referrerError) throw referrerError

      if (referrer) {
        lvla = referrer.refer || ''
        lvlb = referrer.lvla || ''
      }
    }

    const newrefer = await getUniqueReferralCode(supabase)

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        userid,
        uid: generateUid(),
        phone,
        refer: referCode || null,
        username,
        countrycode,
        newrefer,
        lvla: lvla || null,
        lvlb: lvlb || null,
        email,
      })

    if (insertError) throw insertError
      console.log('User profile created with referral code:', newrefer)
    await supabase
      .from('referral')
      .insert({ refer: newrefer, count: 0 })

    try {
      await notifyTeamMemberJoined(supabase, {
        userid,
        username,
        refer: referCode || null,
        lvla: lvla || null,
        lvlb: lvlb || null,
        newrefer,
      })
    } catch (pushError) {
      console.warn('Team join push notification failed:', pushError)
    }

    return res.status(200).json({
      status: 'success',
      newrefer,
    })
  } catch (error) {
    console.log(error);
    return sendApiError(res, error)
  }
}
