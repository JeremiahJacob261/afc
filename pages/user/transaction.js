import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
export default function Transaction() {
    const [trans,setTrans] = useState([])
    const auth = getAuth(app)
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        console.log(user)
        const GET = async () => {
          const { data, error } = await supabase
            .from('notification')
            .select()
            .eq('username', user.displayName)
          setTrans(data[0])
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
