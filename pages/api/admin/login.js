import { isValidAdminPassword, setAdminSessionCookie } from '@/lib/adminAuth'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const { password } = req.body || {}

  if (!isValidAdminPassword(password)) {
    return res.status(401).json({ status: 'error', message: 'Invalid admin credentials' })
  }

  try {
    setAdminSessionCookie(res)
    return res.status(200).json({ status: 'success' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    return res.status(status).json({ status: 'error', message })
  }
}
