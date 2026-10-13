import { supabase } from '@/pages/api/supabase'
import { publicRequests } from './requestCache'

export function readPaymentConfiguration({ fresh = false } = {}) {
  return publicRequests.get('payment-configuration', async () => {
    const [methods, destinations] = await Promise.all([
      supabase.from('walle').select('*').eq('available', true),
      supabase.from('depositwallet').select('*'),
    ])
    if (methods.error) throw methods.error
    if (destinations.error) throw destinations.error
    return { methods: methods.data || [], destinations: destinations.data || [] }
  }, { ttl: 300000, force: fresh })
}
