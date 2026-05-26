import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { profile } = await getCurrentProfile(req, 'username')

    return res.status(200).json({
      status: 'success',
      message: `Bet processing is handled by admin match settlement for ${profile.username}`,
      processed: 0,
      total: 0,
      disabled: true,
    })
  } catch (error) {
    console.error('Process bets disabled endpoint error:', error)
    return sendApiError(res, error)
  }
}
