// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import { supabase } from '../../pages/api/supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async  function handler(req, res) {
    const body = req.body;
    if(body.key !== apiKey){
        return res.status(401).json({message:'unauthorized'})
    }else if(body.type === 'all'){
    const { data, error } = await supabase
                    .from('notification')
                    .select('*')
                    .match({ 'username': body.name })
                    .order('id', { ascending: false });
        const { data:user, error: userrr } = await supabase
        .from('users')
        .select()
        .eq('username',body.name)
                if (error) {
                    console.log(error);
                    return;
                }
                console.log(data);

                res.status(200).json({'data':data,'user':user[0]});
            }else{
                const { data:user, error: userrr } = await supabase
                .from('users')
                .select()
                .eq('username',body.name)
                const { data, error } = await supabase
                .from('notification')
                .select('*')
                .match({ 'username': body.name,'type':body.type })
                .order('id', { ascending: false });
                if (error) {
                    console.log(error);
                    return;
                }
                console.log(data);

                res.status(200).json({'data':data,'user':user[0]});
            }
}