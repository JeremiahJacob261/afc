import { requireAdmin } from '@/lib/adminAuth'
import { notifyUser } from '@/lib/pushNotifications'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

    const username = String(req.body?.username || '').trim()
    if (!username) {
      return res.status(400).json({ status: 'error', message: 'Missing username' })
    }

    const supabase = getSupabaseAdmin()
    const result = await notifyUser(supabase, {
      recipientUsername: username,
      eventType: 'test_push',
      title: 'EFC notification test',
      body: 'Push notifications are ready on this device.',
      sourceTable: 'admin_test_push',
      sourceId: `${username}-${Date.now()}`,
      data: {
        route: 'notifications',
      },
    })

    return res.status(200).json({
      status: 'success',
      push: result.push,
      notificationId: result.notification?.id,
    })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    return res.status(status).json({ status: 'error', message })
  }
}
