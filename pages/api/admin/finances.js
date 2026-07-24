import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  displayPaymentCurrency,
  fetchPaymentMethods,
  findPaymentMethod,
  getPaymentRate,
  isFcfaPaymentCode,
  methodCodeFromRow,
  normalizePaymentCode,
} from '@/lib/paymentMethods'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const supabase = getSupabaseAdmin()
    const find = String(req.method === 'POST' ? req.body?.find || '' : req.query?.find || '').trim()

    let query = supabase
      .from('notification')
      .select('*')
      .neq('address', 'admin')
      .order('id', { ascending: false })
      .limit(150)

    if (find) {
      query = query.ilike('username', `%${find}%`)
    }

    const [{ data, error }, methods] = await Promise.all([
      query,
      fetchPaymentMethods(supabase),
    ])
    if (error) throw error

    const notifications = (data || []).map((notification) => {
      const rawMethod = normalizePaymentCode(notification.method_currency || notification.method || 'fcfa')
      const savedMethod = findPaymentMethod(methods, rawMethod)
      const methodCode = normalizePaymentCode(notification.method_currency) || (savedMethod ? methodCodeFromRow(savedMethod) : rawMethod)
      const isFcfa = isFcfaPaymentCode(methodCode)
      const snapshotRate = Number(notification.method_rate)
      const methodRate = Number.isFinite(snapshotRate) && snapshotRate > 0
        ? snapshotRate
        : getPaymentRate(savedMethod, isFcfa ? 1 : 0)

      return {
        ...notification,
        methodCode,
        methodCurrency: displayPaymentCurrency(methodCode),
        methodRate,
        requiresRateReview: !methodRate,
        isFcfaMethod: isFcfa,
      }
    })

    return res.status(200).json(notifications)
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin finances error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
