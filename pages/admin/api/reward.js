// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async function handler(req, res) {
    const body = req.body;
    let checked = body.checked;
    let reward = body.reward;
    let id = body.id;
    let password = body.password;
    let reason = body.reason;
    const inBal = async () => {
        const { data, error } = await supabase
            .rpc('depositor', { amount: reward ?? 0, names: id })
        console.log(reward);
        if (checked) {
            const { data: nata, error: nerror } = await supabase
                .from('notification')
                .insert({
                    'username': id,
                    'amount': reward ?? 0,
                    'type': 'deposit',
                    'method': reason ?? 'usdt',
                    'address': 'admin'
                })
        }
        if (error) {
            console.log(error)
            res.status(500).json({ error: 'Something went wrong!', error });
        } else {
            res.status(200).json({ success: 'Successfully rewarded' });
        }
    }
    try {
        if (password != 'passwordadmin') {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        inBal();

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Something went wrong!', err });
    }
}