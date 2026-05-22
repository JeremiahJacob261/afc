// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async function handler(req, res) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // getMonth() is zero-based
  const day = today.getDate();
  const dayt = today.getDate() +1;
 const getData = async () => { 
  const dateToday = `${year}-${month}-${(day < 10) ? '0' + day : day}`;
  const dateTomo = `${year}-${(month > 9) ? month : '0'+month}-${(dayt < 10) ? '0' + dayt : dayt}`;
  const options = {
    method: 'GET',
    url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
    params: {
      date: dateTomo,
      status: 'NS'
    },
    headers: {
      'X-RapidAPI-Key': 'e952c28819msha630ccb2c5aa78ep1b4e20jsn4646e30b7202',
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  };
  try {
    const response = await axios.request(options);
    let result = response.data;
    const upcomingMatch = result.response;
    let upcomingMatches = [];
    upcomingMatch.map((f) => {
      let teams = f.teams;
      let times = f.fixture.date;
      const date = new Date(times);
      let home = teams.home;
      let away = teams.away;
      let league = f.league.country + ' ' + f.league.name;
      const hour = date.getUTCHours() + 1;
      const minutes = date.getMinutes();
      const month = date.getMonth() + 1; // Adding 1 because months are zero-indexed
      const day = date.getDate();
      const fullDay = date.getFullYear();
      let strippedDown = {
        league: league,
        home_name: home.name,
        away_name: away.name,
        home_logo: home.logo,
        away_logo: away.logo,
        hour: hour,
        minute: minutes,
        id: f.fixture.id,
        date: fullDay + '-' + month + '-' + day,
        day: day,
        month: month,
        timest:times
      };
      upcomingMatches.push(strippedDown);
    })
    //   function splitIntoChunks(arr, chunkSize) {
    //     let result = [];
    //     while(arr.length > 0) {
    //         let chunk = arr.splice(0, chunkSize);
    //         result.push(chunk);
    //     }
    //     return result;
    //  }

    //  let final = splitIntoChunks(upcomingMatches, 50)[page];
    try {
      const { data, error } = await supabase
        .from('upcoming_matches')
        .upsert(upcomingMatches);
      console.log(data, error)
    } catch (e) {
      console.log(e)
    }

    res.status(200).json({ 'success': 'completed' });
  } catch (err) {
    console.log(err)
    res.status(500).json(err);
  }
 }
 
 const dateTomo = `${year}-${month}-${dayt}`;
 try{
  const { data, error } = await supabase
  .from('upcoming_matches')
  .select('*')
  .eq('date', dateTomo)
  if(data.length === 0){
   getData();
  }else{
    res.status(200).json({ 'success': 'data already exists' });
  }
 }catch(e){
  console.log(e)
  res.status(500).json(e);
 }
}
