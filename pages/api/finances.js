// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async  function handler(req, res) {
    const body = req.body;
    let find = body.find;
    if(isNaN(find)){
      try{
        const {data,count} = await supabase
        .from('notification')
        .select('*')
        .order('id', { ascending: false });
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
        .from('notification')
        .select('*')
        .order('id', { ascending: false });
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
    }
}