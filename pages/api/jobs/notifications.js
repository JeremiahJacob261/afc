import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { deliverNotificationJob } from '@/lib/notificationJobs'
import { withApiTiming } from '@/lib/apiTiming'

export default withApiTiming(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const secret = req.headers['x-job-secret']
  if (typeof secret !== 'string' || !/^[0-9a-f]{64}$/.test(secret)) return res.status(401).json({ message: 'Worker authorization required' })
  try {
    const supabase = getSupabaseAdmin()
    const { data: jobs, error } = await supabase.rpc('claim_notification_jobs', { p_secret: secret, p_limit: 3 })
    if (error) return res.status(error.code === '28000' ? 401 : 503).json({ message: 'Unable to claim notification jobs' })
    const results = await Promise.all((jobs || []).map(async job => {
      let failure = null
      try { await deliverNotificationJob(supabase, job) }
      catch (error) { failure = String(error.message || 'Notification delivery failed').slice(0, 500) }
      const { error } = await supabase.rpc('finish_notification_job', { p_id: job.id, p_lease_token: job.lease_token, p_error: failure })
      if (error) console.warn('Notification lease completion failed', job.id)
      return { id: job.id, delivered: !failure && !error }
    }))
    return res.status(200).json({ processed: results.length, failed: results.filter(result => !result.delivered).length })
  } catch { return res.status(503).json({ message: 'Notification worker unavailable' }) }
})
