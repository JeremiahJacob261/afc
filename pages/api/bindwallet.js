// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import { supabase } from './supabase';
import { NextApiRequest, NextApiResponse } from 'next';
export default async  function handler(req, res) {
   const body = req.body;
   const uid = body.uid;
   const type = body.type; //crypto or local
   const wallet = body.wallet; //address and account number
   const name = body.name; //for locals - account name
   const walletname = body.walletname; //for locals - account name
   const bank = body.bank; // for both - locals -> bank name, crypto -> bitcoin,eth etc
   console.log(body)
try{
 const { data,error:urror} = await supabase
 .from('user_wallets')
 .select('*')
 .match({'uid':uid, "walletnames":walletname});
 console.log(data)
 if(data && data.length > 0){
     res.status(200).json({status: 'failed',message:'Wallet already linked'})
 }else{
    console.log('no wallet')
    const { error} = await supabase
 .from('user_wallets')
 .insert({
        bank:bank,
        names:name,
        wallet:wallet,
        method:type,
        uid:uid,
        walletnames:walletname
 });
    if(error){
        console.log('error:',error)
        res.status(400).json({error: error.message})
    }else{
        console.log('success')
        res.status(200).json({status: 'success',message:'Wallet Binding Success'})
 }
}
  
}catch(error){
    console.log(error.message)
    res.status(500).json({status: 'failed',message:'Please Check your connection'})
}
}