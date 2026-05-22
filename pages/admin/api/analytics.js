import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
export default async function handler(req, res) {
    try{
        const { data, count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  const { data:pata, error } = await supabase
  .from('placed')
  .select('*')
  .filter('created_at', 'eq', new Date().toISOString().split('T')[0])
  const { data:rata, error:rerror } = await supabase
  .from('reading')
  .select('*')
    res.status(200).json({ status: 'success',user:count,bet:pata.length,depo:rata[0].deposit,with:rata[0].withdraw })
    }catch(e){
res.status(400).json({ status: 'failed',error:e })
    }
  }
  