import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'

function getFinanceActionStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('not found') || message.includes('Profile not found')) return 404
  if (message.includes('already processed') || message.includes('already being processed')) return 409
  if (
    message.includes('Invalid')
    || message.includes('Unsupported')
    || message.includes('must be between')
  ) {
    return 400
  }

  return error?.statusCode || 500
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const { id, uid, action } = req.body || {}
    const transactionId = id ?? uid
    const hasId = id !== undefined && id !== null && id !== ''

    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'error', message: 'Invalid finance action' })
    }

    const rpcId = hasId ? Number(id) : null
    if (hasId && !Number.isSafeInteger(rpcId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid finance action' })
    }

    const supabase = getSupabaseAdmin()
    const { data: result, error: rpcErr } = await supabase.rpc('process_finance_request', {
      p_action: action, p_id: rpcId, p_uid: hasId ? null : uid,
    })

    if (rpcErr) throw rpcErr

    const finalSent = result?.sent || (action === 'reject' ? 'failed' : 'success')
    return res.status(200).json({
      status: 'success',
      sent: finalSent,
      alreadyProcessed: Boolean(result?.alreadyProcessed),
    })
  } catch (error) {
    const status = getFinanceActionStatus(error)
    const message = status === 500 ? 'Server error' : error.message
    console.error('Finance action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
