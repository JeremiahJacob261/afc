import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
export default function Transaction() {
  const [trans, setTrans] = useState([])
  const router = useRouter()
  const auth = getAuth(app)
  useEffect(() => {

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
            .order('id', { ascending: false });
          setTrans(data)
          console.log(data.length)
        }
        GET();
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });
  }, [])
  var sn = 0;
  return (
    <Cover>
      <Stack alignItems="center" style={{ minHeight: '85vh', width: '100%' }}>
        <CloseIcon style={{ color: 'white', margin: '12px', width: '50px', height: '50px' }}
          onClick={() => {
            router.push('/user/account')
          }}
        />
        <div style={{ display: 'flex', justifyContent: "center", }}>
          <Typography variant="h4" align='center' style={{ color: 'white', fontFamily: 'Poppins, sans-serif' }}>
            Transaction History
          </Typography></div>
        <Stack direction="column" sx={{ width: '100%' }} spacing={1}>
          <Stack direction="row" justifyContent='space-between'>
            <Typography sx={{ color: 'white' }}>Date/Time</Typography>
            <Typography sx={{ color: 'white' }}>Description</Typography>
            <Typography sx={{ color: 'white' }}>Status</Typography>
          </Stack>
          {
            trans.map((r) => {
              var dts = new Date(r.time);
              console.log(dts.getDate());
              return (
                <Stack direction="row" key={r.uid} justifyContent='space-around' alignItems="center" sx={{ background: '#1A1B72',padding:'5px' }}>
                  <Typography sx={{ color: 'white' ,textAlign:'center',fontSize:'15px',fontWeight:'300'}}>{dts.getDate() + '/' + parseInt(dts.getMonth() + 1) + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</Typography>
                  <Typography sx={{ color: 'white' ,textAlign:'center',fontSize:'15px',fontWeight:'300',width:'150px'}}>Your {r.type} claim of {r.amount} {(r.method === 'usdt') ? 'USDT' : 'Rupees'}</Typography>
                  <Typography sx={{ color: 'white' ,textAlign:'center',fontSize:'15px',fontWeight:'300'}}>{r.sent}</Typography>
                </Stack>
              )
            })

          }
        </Stack>
      </Stack>
    </Cover>
  )
}
