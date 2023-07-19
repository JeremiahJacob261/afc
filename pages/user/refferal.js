import { useContext, useEffect,useState } from "react";
import { AppContext } from "../api/Context";
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../api/supabase'
import Head from 'next/head';
import { Divider, Typography,Stack,Box } from "@mui/material";
export default function Refferal(){
    const {info, setInfo}  = useContext(AppContext);
    const [refs,setRefs]=useState([]);
    const [lvl1,setLvl1] = useState(0);
    const [lvl2,setLvl2] =useState(0) ;
    const [lvl3,setLvl3] = useState(0);
useEffect(()=>{

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

    const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('refer', info.refer)
    setLvl1(data[0].count)
  
}
const getLvlb =async ()=>{

  const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('lvla', info.refer)
  setLvl1(data[0].count)

}
const getLvlc =async ()=>{

  const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('lvlb', info.refer)
  setLvl1(data[0].count)

}
getLvla();
getLvlb();
getLvlc();
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