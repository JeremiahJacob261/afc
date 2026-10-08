import { randomUUID } from 'node:crypto'
import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } }

const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' }
const MAX_BYTES = 5 * 1024 * 1024

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ status: 'error', message: 'Method not allowed' })
    }
    const match = String(req.body?.dataUrl || '').match(/^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/=]+)$/)
    if (!match || !IMAGE_TYPES[match[1]]) return res.status(400).json({ status: 'error', message: 'Choose a PNG, JPEG, WebP, or AVIF image' })
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length || buffer.length > MAX_BYTES) return res.status(400).json({ status: 'error', message: 'Image must be under 5 MB' })
    const supabase = getSupabaseAdmin()
    const path = `wheel-items/${randomUUID()}.${IMAGE_TYPES[match[1]]}`
    const { error } = await supabase.storage.from('wheel-prizes').upload(path, buffer, { contentType: match[1], cacheControl: '31536000', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('wheel-prizes').getPublicUrl(path)
    return res.status(201).json({ status: 'success', imageUrl: data.publicUrl })
  } catch (error) {
    const status = error.statusCode || 500
    console.error('Wheel image upload error:', error)
    return res.status(status).json({ status: 'error', message: status === 500 ? 'Unable to upload image' : error.message })
  }
}
