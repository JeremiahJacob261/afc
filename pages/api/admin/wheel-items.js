import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COLOR = /^#[0-9a-f]{6}$/i

function invalid(message) {
  const error = new Error(message)
  error.statusCode = 400
  throw error
}

function normalizeItems(input) {
  if (!Array.isArray(input) || input.length < 2 || input.length > 12) invalid('Add between 2 and 12 wheel items')
  return input.map((item, index) => {
    const label = String(item?.label || '').trim()
    const imageUrl = String(item?.imageUrl || '').trim()
    const color = String(item?.color || '').trim()
    if (!label || label.length > 32) invalid(`Item ${index + 1} needs a label of 1–32 characters`)
    if (imageUrl.length > 2048 || (imageUrl && !/^\/(?!\/)|^https:\/\//i.test(imageUrl))) invalid(`Item ${index + 1} has an invalid image URL`)
    if (!COLOR.test(color)) invalid(`Item ${index + 1} needs a valid color`)
    return { id: UUID.test(String(item?.id || '')) ? item.id : null, label, imageUrl, color }
  })
}

async function readWheel(supabase) {
  const { data, error } = await supabase.rpc('read_wheel_configuration')
  if (error) throw error
  return data
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'success', ...await readWheel(supabase) })
    }
    if (req.method === 'PUT') {
      const revision = Number(req.body?.revision)
      if (!Number.isSafeInteger(revision) || revision < 1) invalid('Reload the wheel before saving')
      const items = normalizeItems(req.body?.items)
      const { error } = await supabase.rpc('replace_wheel_configuration', {
        p_expected_revision: revision,
        p_items: items,
      })
      if (error) {
        if (error.message?.includes('wheel changed since')) return res.status(409).json({ status: 'error', message: error.message })
        throw error
      }
      return res.status(200).json({ status: 'success', ...await readWheel(supabase) })
    }
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  } catch (error) {
    const status = error.statusCode || 500
    console.error('Wheel admin API error:', error)
    return res.status(status).json({ status: 'error', message: status === 500 ? 'Unable to save the wheel' : error.message })
  }
}
