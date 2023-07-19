import { useContext, useEffect,useState } from "react";
import { AppContext } from "../api/Context";
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../api/supabase'
import Head from 'next/head';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
import { Divider, Typography,Stack,Box } from "@mui/material";
export default function Refferal(){
    const [info, setInfo]  = useState({});
    const [refs,setRefs]=useState([]);
    const [lvl1,setLvl1] = useState(0);
    const [lvl2,setLvl2] =useState(0) ;
    const auth = getAuth(app);
    const [lvl3,setLvl3] = useState(0);
useEffect(()=>{
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      // ...
      console.log(user)
      const GET = async () => {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('userId', user.uid)
        setInfo(data[0])
        console.log(data)
      }
      GET();
    } else {
      // User is signed out
      // ...
      console.log('sign out');
      router.push('/login');
    }
  });
    const getRefs=async()=>{
    const { data, error } = await supabase
    .from('users')
    .select()
    .eq('refer', info.refer);
setRefs(data);
console.log(info);
console.log(error);
}
getRefs();
//get count 1
const getLvla =async ()=>{
  try{
const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('refer', info.newrefer)
    setLvl1(data[0].count)
  console.log(error)
  console.log(data)
  }catch(e){
    
  }
    
}
const getLvlb =async ()=>{
  try{
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('lvla', info.newrefer)
  setLvl1(data[0].count)
  }catch(e){
    
  }
  

}
const getLvlc =async ()=>{
try{
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('lvlb', info.newrefer)
  setLvl1(data[0].count)
}catch(e){
  
}
  

}
try{
getLvla();
getLvlb();
getLvlc();
}catch(e){

}

},[])

const columns = [
    { field: 'statId', headerName: 'ID', width: 50 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: '', headerName: 'Date', width: 90 },
    {
      field: 'level',
      headerName: 'Level',
      type: 'number',
      width: 70,
    },
    {
        field: 'balance',
        headerName: 'Amount',
        type: 'number',
        width: 100,
      },
  ];
  const rows = refs;
  var sn = 0;
    return(
<div>
<Head>
        <title>Refferal Details</title>
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="row" spacing={5}>
        <Box>
<Typography>level 1</Typography>
<Typography>{lvl1}</Typography></Box>
      <Divider style={{background:'white'}}/>
      <Box>
<Typography>level 1</Typography>
<Typography>{lvl2}</Typography></Box>
      <Divider style={{background:'white'}}/>
      <Box>
<Typography>level 1</Typography>
<Typography>{lvl3}</Typography></Box>
      <Divider style={{background:'white'}}/>
      </Stack>
<Typography>Total : {lvl1+lvl2+lvl3} </Typography>
      <Divider style={{background:'white'}}/>
      <table>
  <tr>
    <th style={{width:'50px',color:'white'}}>S/N</th>
    <th style={{width:'100px',color:'white'}}>Username</th>
    <th style={{width:'50px',color:'white'}}>Date/Time</th>
    <th style={{width:'50px',color:'white'}}>Level</th>
    <th style={{width:'50px',color:'white'}}>Amount</th>
  </tr>
  {
      refs.map((r)=>{
          sn++;
          var dts = new Date(r.crdate);
          console.log(dts.getDate());
          return(
            <tr key={r.username}>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{sn}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{r.username}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{dts.getDate()+'/'+dts.getMonth()+'/'+dts.getFullYear()+' '+dts.getHours()+':'+dts.getMinutes()}</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{r.level}</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{r.balance}</th>
          </tr>
          )
      })
  }
</table>
</div>
    );
}