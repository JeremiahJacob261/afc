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
import { getAuth, signOut } from "firebase/auth";
import Sg from '../../public/icon/sgpay.png'
import Su from '../../public/icon/susdt.png'
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
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Choose Payment Method</Typography>
      </Stack>
        
        <Stack direction="row">
<Image src={Su} width={255} height={145} alt='su'/>
<Image src={Sg} width={255} height={145} alt='su'/>
        </Stack>
              </Stack>
    </Cover>
  )
}
