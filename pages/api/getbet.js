// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async  function handler(req, res) {
    const body = req.body;
    let id = body.id;
try{
    const { data, error } = await supabase
    .from('placed')
    .select('*')
    .eq('id', id)
    if (error){
        console.log(error)
        res.status(500).json({ status:'failed',error: 'Something went wrong!',error});
    }else{
        res.status(200).json({ status:'sucesss',data: data });
    }
}catch(e){
    res.status(500).json({status:'failed', error: 'Something went wrong!',e});
}
}