import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export default async function handler(req, res) {
    try{
        requireAdmin(req)
        const supabase = getSupabaseAdmin()
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        const { data, count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  const { count: betCount, error } = await supabase
  .from('placed')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', start.toISOString())
  .lt('created_at', end.toISOString())
  const { data:rata, error:rerror } = await supabase
  .from('reading')
  .select('deposit,withdraw')
  .limit(1)
  .maybeSingle()
    if (error) throw error
    if (rerror) throw rerror
    res.status(200).json({ status: 'success',user:count || 0,bet:betCount || 0,depo:Number(rata?.deposit || 0),with:Number(rata?.withdraw || 0) })
    }catch(e){
const status = e.statusCode || 400
res.status(status).json({ status: 'failed',error:e.message || e })
    }
  }
  
