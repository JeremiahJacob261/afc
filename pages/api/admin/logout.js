import { clearAdminSessionCookie } from '@/lib/adminAuth'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  clearAdminSessionCookie(res)
  return res.status(200).json({ status: 'success' })
}
