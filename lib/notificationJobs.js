import { notifyTeamMemberJoined, notifyFinanceAction, notifyBetSettlements, notifyCompanyMatchPosted, sendPushToUsername } from './pushNotifications'
import { ensureUpcomingMatchesCurrent } from './apiFootballSync'

function assertDelivery(result) {
  if (Array.isArray(result)) return result.forEach(assertDelivery)
  const push = result?.push || result
  if (push?.retryableFailures > 0 || push?.firebaseConfigured === false && !push?.noRecipients) {
    throw new Error('Push delivery requires retry')
  }
}

export async function deliverNotificationJob(supabase, job) {
  let result
  switch (job.kind) {
    case 'team': result = await notifyTeamMemberJoined(supabase, job.payload); break
    case 'finance': result = await notifyFinanceAction(supabase, job.payload); break
    case 'settlement': result = await notifyBetSettlements(supabase, job.payload); break
    case 'company_match': result = await notifyCompanyMatchPosted(supabase, job.payload); break
    case 'wheel_push': {
      const p = job.payload
      result = await sendPushToUsername(supabase, p.username, { title: p.title, body: p.body,
        data: { ...p.data, eventType: 'wheel_reward', notificationId: p.id } })
      break
    }
    case 'receipt_cleanup': {
      const path = job.payload.path
      const bucket = supabase.storage.from('trcreceipt')
      const address = bucket.getPublicUrl(path).data.publicUrl
      const { data, error } = await supabase.from('notification').select('id').eq('address', address).limit(1)
      if (error) throw error
      if (!data?.length) { const { error } = await bucket.remove([path]); if (error) throw error }
      return
    }
    case 'match_sync': await ensureUpcomingMatchesCurrent(supabase); return
    default: throw new Error('Unknown notification job')
  }
  assertDelivery(result)
}
