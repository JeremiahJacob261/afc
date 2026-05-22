import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '@/pages/api/supabase'
import Cover from './cover'
import Image from 'next/image'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import { app } from '@/pages/api/firebase';
import { getAuth, signOut } from "firebase/auth";
import { motion } from 'framer-motion';
import Loading from "@/pages/components/loading";
import Loadingx from "@/pages/components/loadx";
import { clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';



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
    const GET = async () => {
      const session = await requireSession(router);
      if (!session) return;
      clearLegacyAuthStorage();
    }

    GET();
  }, [router])
  var sn = 0;
  return (
    <Cover >
      <Loading open={openx} handleClose={handleClosex} />
      <Loadingx open={openy} handleClose={handleClosey} currency={curcode}/>
      <Stack style={{ minHeight: '95vh', width: '100%', paddingBottom: '120px' }} spacing={2}>
        <Stack direction='column' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#E9E5DA' }} onClick={() => {
            router.push('/user/fund')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#E9E5DA' }}>Choose Payment Method</Typography>
        </Stack>

        <Stack direction="column" sx={{ overflowX: 'auto', maxWidth: '360px' }} spacing={2}
        >
          {
            wallx.map((m) => {
              return (
                <Stack direction="column" alignItems='center' justifyContent="space-around" sx={{ minWidth: '255px', height: '145px', background: '#10284D', borderRadius: '5px', padding: '8px' }}
                  key={m.name}
                  onClick={() => {

                    if (m.currency_code === 'fcfa' || m.currency_code === 'mmk'|| m.currency_code === 'idr') {
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
                  <p style={{ color: '#E9E5DA', fontFamily: 'Poppins, san-serif', fontWeight: '300' }}>{m.name}</p>
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
