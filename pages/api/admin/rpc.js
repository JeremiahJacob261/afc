import { callInternalRpc } from '@/lib/serverRpc'
import { requireAdmin } from '@/lib/adminAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)

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
