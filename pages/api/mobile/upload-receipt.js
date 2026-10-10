import { getCurrentProfile, sendApiError } from '@/lib/apiAuth'

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } }
const MAX_BYTES = 8 * 1024 * 1024

function imageExtension(bytes, mime) {
  if (mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (mime === 'image/webp' && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp'
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  // Keep off until receipt visibility and retention are approved; no RLS or bucket change is made here.
  if (process.env.UCL_NATIVE_RECEIPT_UPLOAD_ENABLED !== 'true') return res.status(503).json({ status: 'error', message: 'Receipt uploads are unavailable' })
  try {
    const { user, supabase } = await getCurrentProfile(req, 'userid')
    const { image, mimeType, uploadId } = req.body || {}
    if (typeof image !== 'string' || image.length > Math.ceil(MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image)
      || !/^[0-9a-f-]{36}$/i.test(String(uploadId || ''))) return res.status(400).json({ status: 'error', message: 'Invalid receipt' })
    const bytes = Buffer.from(image, 'base64')
    const extension = imageExtension(bytes, mimeType)
    if (!extension || !bytes.length || bytes.length > MAX_BYTES) return res.status(400).json({ status: 'error', message: 'Use a JPEG, PNG or WebP image up to 8 MB' })
    const path = `native/${user.id}/${uploadId}.${extension}`
    const bucket = supabase.storage.from('trcreceipt')
    const { error } = await bucket.upload(path, bytes, { contentType: mimeType, upsert: false })
    if (error && ![409, '409'].includes(error.statusCode)) throw error
    const url = bucket.getPublicUrl(path).data?.publicUrl
    if (!url) throw new Error('Receipt URL unavailable')
    return res.status(200).json({ status: 'success', path, url })
  } catch (error) { return sendApiError(res, error) }
}
