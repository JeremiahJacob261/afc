import { requireAdmin } from '@/lib/adminAuth'
import { getAdminDashboardData } from '@/lib/adminDashboardData'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const data = await getAdminDashboardData()
    return res.status(200).json(data)
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin dashboard error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
