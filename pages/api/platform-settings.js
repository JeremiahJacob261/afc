import { getPlatformLinks } from '@/lib/adminSettings'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    const links = await getPlatformLinks(getSupabaseAdmin(), { allowDefaultOnMissingTable: true })
    return res.status(200).json({ status: 'success', links })
  } catch (error) {
    console.error('Platform settings error:', error)
    return res.status(500).json({ status: 'error', message: 'Unable to load platform settings' })
  }
}
