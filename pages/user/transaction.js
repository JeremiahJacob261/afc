import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
export default function Transaction() {
    const [trans,setTrans] = useState([])
    useEffect(()=>{
        const getTran=async()=>{
             const { data, error } = await supabase
        .from('notification')
        .select()
        .eq('username',localStorage.getItem('me'))
    setTrans(data);
        }
       getTran()
    },[])
  var sn = 0;
    return(
        <Cover>
 <div style={{display:'flex',justifyContent:"center"}}>
        <Typography variant="h4" align='center' style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>
          Transaction History
        </Typography></div>
        <Stack direction="column-reverse">
        <table>
  <tr>
    <th style={{width:'80px',color:'#DBE9EE'}}>Date/Time</th>
    <th style={{width:'150px',color:'#DBE9EE'}}>Description</th>
    <th style={{width:'70px',color:'#DBE9EE'}}>Status</th>
  </tr>
  {
      trans.map((r)=>{
          var dts = new Date(r.time);
          console.log(dts.getDate());
          return(
            <tr key={r.uid}>
            <th style={{width:'80px',color:'white'}}>{dts.getDate()+'/'+dts.getMonth()+'/'+dts.getFullYear()+' '+dts.getHours()+':'+dts.getMinutes()}</th>
            <th style={{width:'150px',color:'white'}}>Your {r.type} claim of {r.amount} USDT</th>
            <th style={{width:'70px',color:'white'}}>{r.sent}</th>
          </tr>
          )
      })
  }
</table>
        </Stack>
        </Cover>
    )
}
