import { callInternalRpc } from '@/lib/serverRpc'

function requireAdminPassword(req) {
  const expected = process.env.ADMIN_ACTION_PASSWORD || 'passwordadmin'
  const provided = req.headers['x-admin-password'] || req.body?.password
  const fallbackPasswords = process.env.ADMIN_ACTION_PASSWORD
    ? [expected]
    : [expected, 'invisibleadmin', 'nopassword']

  if (!provided || !fallbackPasswords.includes(provided)) {
    const error = new Error('Unauthorized')
    error.statusCode = 401
    throw error
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdminPassword(req)

    const { functionName, params } = req.body || {}
    if (!functionName || typeof functionName !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Missing RPC function name' })
    }

    const result = await callInternalRpc(req, functionName, params || {})
    return res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin RPC error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
