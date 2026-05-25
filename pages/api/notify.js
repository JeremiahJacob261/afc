import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const { profile, supabase } = await getCurrentProfile(req, 'username,newrefer')
    const bonuscode = {
      depbonus: 'You have received a deposit bonus',
      affbonus: 'You have received an REBATE commission',
    }

    const datacontrol = []

    const { data: getr, error: getrerror } = await supabase
      .from('activa')
      .select()
      .eq('code', profile.newrefer)
      .order('id', { ascending: false })

    if (getrerror) throw getrerror

    ;(getr || []).forEach((item) => {
      datacontrol.push({
        message: `${bonuscode[item.type] || 'You have received a bonus'} of ${parseFloat(item.amount || 0).toFixed(4)} from ${item.username}`,
        time: item.created_at,
      })
    })

    const { data: getb, error: getberror } = await supabase
      .from('activa')
      .select()
      .eq('code', 'broadcast')
      .order('id', { ascending: false })

    if (getberror) throw getberror

    ;(getb || []).forEach((item) => {
      datacontrol.push({
        message: `${item.username}`,
        time: item.created_at,
      })
    })

    const { data: getu, error: getuerror } = await supabase
      .from('activa')
      .select()
      .match({ username: profile.username, code: 'bet' })
      .order('id', { ascending: false })

    if (getuerror) throw getuerror

    ;(getu || []).forEach((item) => {
      datacontrol.push({
        message: `You have won your bet of ${parseFloat(item.amount || 0).toFixed(2)} USDT`,
        time: item.created_at,
      })
    })

    const { data: getx, error: getxerror } = await supabase
      .from('notification')
      .select()
      .eq('username', profile.username)
      .in('sent', ['success', 'failed'])
      .order('id', { ascending: false })

    if (getxerror) throw getxerror

    ;(getx || []).forEach((item) => {
      datacontrol.push({
        message: `Your ${item.type} of ${parseFloat(item.amount || 0).toFixed(2)} ${item.method} is ${item.sent}`,
        time: item.time,
      })
    })

    const { data: getad, error: getaderror } = await supabase
      .from('notification')
      .select()
      .match({ username: profile.username, address: 'admin' })
      .order('id', { ascending: false })

    if (getaderror) throw getaderror

    ;(getad || []).forEach((item) => {
      datacontrol.push({
        message: `You have received ${parseFloat(item.amount || 0).toFixed(2)} USDT ${item.method} from admin`,
        time: item.time,
      })
    })

    return res.status(200).json(datacontrol)
  } catch (error) {
    return sendApiError(res, error)
  }
}
