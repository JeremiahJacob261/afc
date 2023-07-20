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
    const [lvl2,setLvl2] =useState(0);
    const [lvlo,setLvlo] = useState([]);
    const [lvll,setLvll] = useState([]);
    const auth = getAuth(app);
    const [lvl3,setLvl3] = useState(0);
useEffect(()=>{
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      // ...
      const GET = async () => {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('userId', user.uid)
        setInfo(data[0])
      }
      GET();
    } else {
      // User is signed out
      // ...
      console.log('sign out');
      router.push('/login');
    }
  });
   //get refs
const getRefs=async()=>{
  const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('refer', info.newrefer);
setRefs(data);
try {

setLvl1(data[0].count + 1)

} catch (error) {

}
}
const getLvl0=async()=>{
const { data, error } = await supabase
.from('users')
.select()
.eq('lvla', info.newrefer);
setLvlo(data);
try {

setLvl2(data[0].count + 1)
} catch (error) {
  
}
}
const getLvll=async()=>{
const { data, error } = await supabase
.from('users')
.select()
.eq('lvlb', info.newrefer);
setLvll(data);
try {  
setLvl3(data[0].count + 1)
} catch (error) {
  
}
console.log(data);
}
getRefs();
getLvl0();
getLvll();
//end refs

},[lvl3,lvl2,lvl1,lvll,lvlo,refs])

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
<Typography>level 2</Typography>
<Typography>{lvl2}</Typography></Box>
      <Divider style={{background:'white'}}/>
      <Box>
<Typography>level 3</Typography>
<Typography>{lvl3}</Typography></Box>
      <Divider style={{background:'white'}}/>
      </Stack>
<Typography>Total : {lvl1+lvl2+lvl3} </Typography>
      <Divider style={{background:'white'}}/>
      <table>
        <tbody>
  <tr>
    <th style={{width:'50px',color:'white'}}>S/N</th>
    <th style={{width:'100px',color:'white'}}>Username</th>
    <th style={{width:'50px',color:'white'}}>Date/Time</th>
    <th style={{width:'50px',color:'white'}}>Level</th>
    <th style={{width:'50px',color:'white'}}>Balance</th>
  </tr>
  {
      refs.map((r)=>{
          sn++;
          var dts = new Date(r.crdate);
         
          return(
            <tr key={r.username}>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{sn}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{r.username}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{dts.getDate()+'/'+dts.getMonth()+'/'+dts.getFullYear()+' '+dts.getHours()+':'+dts.getMinutes()}</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>1</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{r.balance}</th>
          </tr>
          )
      })
  }
  {
      lvlo.map((r)=>{
          sn++;
          var dts = new Date(r.crdate);
         
          return(
            <tr key={r.username}>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{sn}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{r.username}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{dts.getDate()+'/'+dts.getMonth()+'/'+dts.getFullYear()+' '+dts.getHours()+':'+dts.getMinutes()}</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>2</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{r.balance}</th>
          </tr>
          )
      })
  }
  {
      lvll.map((r)=>{
          sn++;
          var dts = new Date(r.crdate);
         
          return(
            <tr key={r.username}>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{sn}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{r.username}</th>
            <th style={{width:'100px',color:'white',fontSize:'14px'}}>{dts.getDate()+'/'+dts.getMonth()+'/'+dts.getFullYear()+' '+dts.getHours()+':'+dts.getMinutes()}</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>3</th>
            <th style={{width:'50px',color:'white',fontSize:'14px'}}>{r.balance}</th>
          </tr>
          )
      })
  }
  </tbody>
</table>
</div>
    );
}