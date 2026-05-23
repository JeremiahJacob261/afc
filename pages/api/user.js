// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export default async  function handler(req, res) {
    try {
      requireAdmin(req)
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const supabase = getSupabaseAdmin()
    const body = req.body;
    let find = body.find;
    if(isNaN(find)){
      try{
        const {data,count} = await supabase
        .from('users')
        .select('*')
        let result = data;
        const newFilter = data.filter((value) => {
            return value.username.toLowerCase().includes(find.toLowerCase());
          });
          console.log(newFilter)
        res.status(200).json(newFilter);
      }catch(err){
        console.log(err)
        res.status(500).json({ error: 'Something went wrong!',err});
      }
    }else{
      try{
        const {data,count} = await supabase
        .from('users')
        .select('*')
        let result = data;
        const newFilter = data.filter((value) => {
            return value.newrefer.toLowerCase().includes(find.toLowerCase());
          });
          console.log(newFilter)
        res.status(200).json(newFilter);
      }catch(err){
        console.log(err)
        res.status(500).json({ error: 'Something went wrong!',err});
      }
    }
}
