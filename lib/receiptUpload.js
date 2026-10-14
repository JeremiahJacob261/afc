import { supabase } from '@/pages/api/supabase'
import { readClientSession } from './clientAuth'

export async function compressReceipt(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error('Use a JPEG, PNG or WebP receipt up to 20 MB')
  }
  if (file.size < 400 * 1024 || typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const compressed = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .92))
    return compressed && compressed.size < file.size ? compressed : file
  } finally { bitmap.close() }
}

export function createReceiptUpload(file, ownerId, onProgress = () => {}) {
  const attempt = { file, ownerId, path: null, url: '', promise: null, accepted: false, submitted: false, onProgress, progress: { stage: 'idle', percent: 0 } }
  const progress = state => { attempt.progress = state; attempt.onProgress(state) }
  attempt.start = () => {
    if (attempt.promise) return attempt.promise
    attempt.promise = (async () => {
      progress({ stage: 'preparing', percent: 0 })
      const blob = await compressReceipt(file)
      if (blob.size > 8 * 1024 * 1024) throw new Error('The receipt is too large. Choose a smaller image')
      const { data } = await readClientSession()
      if (data?.session?.user?.id !== ownerId) throw new Error('Authentication required')
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[blob.type]
      attempt.path ||= `public/web/${ownerId}/${crypto.randomUUID()}.${extension}`
      progress({ stage: 'uploading', percent: 0 })
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/trcreceipt/${attempt.path}`)
        xhr.setRequestHeader('Authorization', `Bearer ${data.session.access_token}`)
        xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        xhr.setRequestHeader('Content-Type', blob.type)
        xhr.timeout = 60000
        xhr.upload.onprogress = event => { if (event.lengthComputable) progress({ stage: 'uploading', percent: Math.round(event.loaded / event.total * 100) }) }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 || xhr.status === 409 ? resolve() : reject(Object.assign(new Error('Unable to upload receipt'), { status: xhr.status }))
        xhr.onerror = xhr.ontimeout = () => reject(new Error('Unable to upload receipt. Please try again'))
        xhr.send(blob)
      })
      attempt.url = supabase.storage.from('trcreceipt').getPublicUrl(attempt.path).data.publicUrl
      progress({ stage: 'ready', percent: 100 })
      return attempt.url
    })().catch(error => { attempt.promise = null; progress({ stage: 'error', percent: 0 }); throw error })
    return attempt.promise
  }
  attempt.discard = async () => {
    try { await attempt.promise } catch { /* A failed upload may still have reached storage. */ }
    if (attempt.path && !attempt.accepted && !attempt.submitted) await supabase.storage.from('trcreceipt').remove([attempt.path]).catch(() => {})
  }
  return attempt
}
