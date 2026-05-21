import { getCurrentUser, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const user = await getCurrentUser(req)
    return res.status(200).json({ status: 'success', user })
  } catch (error) {
    return sendApiError(res, error)
  }
}
