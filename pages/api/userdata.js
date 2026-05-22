// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async  function handler(req, res) {
    const body = req.body;
   try{
  const { data, error } = await supabase
.from('users')
.select('*')
let user = data;
let today = new Date();
let todayDate = today.getDate();
let tomoDate = today.getDate() + 1;
let beforeDate = today.getDate() + 2;
let todayMonth = today.getMonth() + 1;
let todayYear = today.getFullYear();
let dataToday = [];
let todaycount = 0;
let tomoCount = 0;
let beforeCount = 0;
 user.map((m)=>{
   let thedates = m.date;
   let thedate = new Date(thedates);
    let theDay = thedate.getDate();
    let theMonth = thedate.getMonth() + 1;
    if (theDay == todayDate && theMonth == todayMonth && todayYear == thedate.getFullYear()) {
        todaycount = todaycount + 1;
    }else if(theDay == tomoDate && theMonth == todayMonth && todayYear == thedate.getFullYear()){
        tomoCount = tomoCount + 1;

    }else if(theDay == beforeDate && theMonth == todayMonth && todayYear == thedate.getFullYear()){
        beforeCount = beforeCount + 1;
    }

 })
    let todayData = [todaycount,tomoCount,beforeCount];
    res.status(200).json(todayData);
console.log(todayData);
   }catch(e){
         console.log(e);
   } 
      
    
}