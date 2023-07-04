import { useContext, useEffect,useState } from "react";
import { AppContext } from "../api/Context";
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../api/supabase'
import Head from 'next/head';
export default function Refferal(){
    const { info, setInfo } = useContext(AppContext);
    const [refs,setRefs]=useState([]);
useEffect(()=>{
    const getRefs=async()=>{
    const { data, error } = await supabase
    .from('users')
    .select()
    .eq('refer', info.refer);
setRefs(data);
console.log(info);
console.log(data);
}
getRefs();
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
      <table>
  <tr>
    <th style={{width:'50px',color:'white'}}>S/N</th>
    <th style={{width:'100px',color:'white'}}>Username</th>
    <th style={{width:'50px',color:'white'}}>Date</th>
    <th style={{width:'50px',color:'white'}}>Level</th>
    <th style={{width:'50px',color:'white'}}>Amount</th>
  </tr>
  {
      refs.map((r)=>{
          sn++;
          return(
            <tr>
            <th style={{width:'50px',color:'white'}}>{sn}</th>
            <th style={{width:'100px',color:'white'}}>{r.username}</th>
            <th style={{width:'100px',color:'white'}}>dates</th>
            <th style={{width:'50px',color:'white'}}>{r.level}</th>
            <th style={{width:'50px',color:'white'}}>{r.balance}</th>
          </tr>
          )
      })
  }
</table>
</div>
    );
}