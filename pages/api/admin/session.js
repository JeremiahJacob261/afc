import { requireAdmin } from '@/lib/adminAuth'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    return res.status(200).json({ status: 'success', authenticated: true })
  } catch (error) {
    return res.status(401).json({ status: 'error', authenticated: false, message: 'Unauthorized' })
  }
}
