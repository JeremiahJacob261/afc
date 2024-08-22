import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
import Image from 'next/image'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import { app } from '../api/firebase';
import { getAuth, signOut } from "firebase/auth";
import { motion } from 'framer-motion';
import Loading from "@/pages/components/loading";
import Loadingx from "@/pages/components/loadx";



export default function Transaction({ wallx }) {
  const [trans, setTrans] = useState([])
  const router = useRouter()
  const [curcode, setCurcode] = useState('');
  //the below controls the loading modal
  const [openx, setOpenx] = useState(false);
  const handleOpenx = () => setOpenx(true);
  const handleClosex = () => setOpenx(false);

  //the end of thellaoding modal control


  //the below controls the selection modal
  const [openy, setOpeny] = useState(false);
  const handleOpeny = () => setOpeny(true);
  const handleClosey = () => setOpeny(false);

  //the end of thellaoding selection control
  const auth = getAuth(app)
  const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      // ...

      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('notification')
            .select()
            .eq('username', name)
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
        localStorage.removeItem('signedIns');
        localStorage.removeItem('signUids');
        localStorage.removeItem('signNames');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
      sOut();
    }

  }, [])
  var sn = 0;
  return (
    <Cover >
      <Loading open={openx} handleClose={handleClosex} />
      <Loadingx open={openy} handleClose={handleClosey} currency={curcode}/>
      <Stack style={{ minHeight: '95vh', width: '100%', paddingBottom: '120px' }} spacing={2}>
        <Stack direction='column' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#cacaca' }} onClick={() => {
            router.push('/user/fund')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#cacaca' }}>Choose Payment Method</Typography>
        </Stack>

        <Stack direction="column" sx={{ overflowX: 'auto', maxWidth: '360px' }} spacing={2}
        >
          {
            wallx.map((m) => {
              return (
                <Stack direction="column" alignItems='center' justifyContent="space-around" sx={{ minWidth: '255px', height: '145px', background: '#373636', borderRadius: '5px', padding: '8px' }}
                  key={m.name}
                  onClick={() => {

                    if (m.currency_code === 'fcfa' || m.currency_code === 'mmk') {
                      localStorage.setItem('dm', m.currency_code)
                      setCurcode(m.currency_code);
                      handleOpeny()
                    } else {
                      localStorage.setItem('dm', m.currency_code)
                      handleOpenx()
                      router.push('/user/inputvalue?dm=' + m.currency_code);
                    }

                  }}
                >
                  <Image src={m.image} width={75} height={75} alt={m.name} style={{ borderRadius: '9px' }} />
                  <p style={{ color: '#cacaca', fontFamily: 'Poppins, san-serif', fontWeight: '300' }}>{m.name}</p>
                </Stack>
              )
            })
          }
        </Stack>

      </Stack>
    </Cover>
  )
}

export const getServerSideProps = async (context) => {

  try {
    const { data: wallets, error: walleterror } = await supabase
      .from('walle')
      .select('*')
      .eq('available', true);
    return {
      props: { wallx: wallets }
    }
  } catch (e) {
    return {
      props: { wallx: [] }
    }
  }


}