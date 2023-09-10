import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import { app } from '../api/firebase';
import Image from 'next/image'
import { onAuthStateChanged } from "firebase/auth";
import Rd from '../../public/icon/rounds.png'
import { getAuth, signOut } from "firebase/auth";
import Sg from '../../public/icon/sgpay.png'
import AiZm from '../../public/icon/airtel.png'
import Su from '../../public/icon/susdt.png'
export default function Transaction() {
  const [trans, setTrans] = useState([])
  const router = useRouter()
  const auth = getAuth(app)
  const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  useEffect(() => {
    const useri = localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // ...
      
      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('notification')
            .select()
            .eq('username',name)
            .order('id', { ascending: false });
          setTrans(data)
          console.log(data.length)
        } catch (e) {
          console.log(e)
        }

      }
      GET();
      
    } else {
      // User is signed out
      const sOut = async () => {
        const { error } = await supabase.auth.signOut();
                console.log('sign out');
                console.log(error);
                localStorage.removeItem('signedIn');
                localStorage.removeItem('signUid');
                localStorage.removeItem('signName');
                localStorage.removeItem('signRef');
                router.push('/login');
                }
                sOut();
    }

  }, [])
  var sn = 0;
  return (
    <Cover>
      <Stack style={{ minHeight: '85vh', width: '100%' }} spacing={2}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
            router.push('/user/fund')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Choose Payment Method</Typography>
        </Stack>

        <Stack direction="row" sx={{ overflowX: 'auto', maxWidth: '360px' }} spacing={2}>
          <Image src={Su} width={255} height={145} alt='su' onClick={() => {
            localStorage.setItem('dm', 'usdt');
            router.push('/user/inputvalue')
          }} />
          <Image src={Sg} width={255} height={145} alt='su' onClick={() => {
            localStorage.setItem('dm', 'gpay');
            router.push('/user/inputvalue')
          }} />
          <Image src={AiZm} width={255} height={145} alt='su' onClick={() => {
            localStorage.setItem('dm', 'airtel');
            router.push('/user/inputvalue')
          }} />
        </Stack>
        <Stack direction='row' justifyContent='space-between'>
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>Recent Transactions</Typography>
          <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>See All</Typography>
        </Stack>
        <Divider sx={{ background: 'black', borderBottomWidth: '2px' }} />
        {
          trans.map((t) => {
            let date = new Date(t.time);
            let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
            let month = months[date.getMonth()];
            return (
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems='center' sx={{ padding: '8px' }} key={t.id}>
                <Image src={Rd} width={40} height={40} alt='rounds' />
                <Stack direction='column' alignItems='start' sx={{ width: '196px' }}>
                  <Typography style={{ color: 'black', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>{(t.method === 'usdt') ? 'USDT' : 'Gpay'}
                  </Typography>
                  <Typography style={{ color: 'black', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{month} {date.getDate()}</Typography>

                </Stack>
                <Typography style={{ color: 'black', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{t.amount} {(t.method === 'usdt') ? 'USDT' : '₹'}</Typography>
              </Stack>
            )
          })
        }
      </Stack>
    </Cover>
  )
}
