import { Stack, Typography } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../api/supabase';
import Head from 'next/head'
import Image from 'next/image'
import Rd from '../../public/icon/rounds.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
export default function Notification() {
  const router = useRouter();
  const [not, setNot] = useState([]);
  const [info, setInfo] = useState({});
  const isMounted = useRef(true);
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      const ref = localStorage.removeItem('signRef');
      // ...
      if (isMounted.current) {
        console.log(ref)
        const GET = async () => {
          let test = await fetch('/api/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, })
          }).then(data => {
            return data.json();
          })
          setNot(test);
        }
        GET();

        isMounted.current = false;
      } else {

      }
    }

  }, []);

  return (
    <Stack direction="column" sx={{ minHeight: '100vh' }}>
      <Head>
        <title>Notifications</title>
        <link rel="icon" href="/brentford.ico" />
      </Head>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#cacaca' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#cacaca' }}>Notifications</Typography>
      </Stack>
      <Stack direction="row">
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500', padding: '8px', color: '#cacaca' }}>Notification ({not.length})</Typography>

      </Stack>
      <Stack direction='column'>
        {
          not.map((r) => {
            console.log(r)
            let date = new Date(r.time);
            let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
            return (
              <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.time}>
                <Image src={Rd} width={40} height={40} alt='rounds' />
                <Stack direction='column' sx={{ width: '196px' }}>
                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>{r.message}
                  </Typography>
                </Stack>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
              </Stack>
            )
          })
        }
      </Stack>
    </Stack>
  )
}