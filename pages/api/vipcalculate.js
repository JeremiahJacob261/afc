import { NextResponse } from 'next/server';
import { supabase } from '@/pages/api/supabase';

export default async function handler(req, res) {
    const body = req.body;
    try {
        const { data: user, error: uerror } = await supabase
            .from('users')
            .select('*')
            .eq('username', body.username)
        let users = user[0] ?? null;

        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .match({
                'refer': user[0].newrefer,
                'firstd': true
            });
        console.log(count);
        let vipl = (users.totald < 50 || count < 3) ? '1' : (users.totald < 100 || count < 5) ? '2' : (users.totald < 200 || count < 8) ? '3' : (users.totald < 300 || count < 12) ? '4' : (users.totald < 500 || count < 15) ? '5' : (users.totald < 1000 || count < 20) ? '6' : '7';
        res.status(200).json({ status: "success", viplevel: vipl })

    } catch (e) {
        console.log(e)
        res.status(200).json({ status: "error", viplevel: '1' })
    }
}