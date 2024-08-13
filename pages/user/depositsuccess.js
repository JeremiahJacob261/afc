import { Stack, Button, Typography } from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import WS from '../../public/icon/depos.png'
import Loading from "@/pages/components/loading";
export default function Dsuccess() {
  const router = useRouter();
  const [amo, setAmo] = useState();
  useEffect(() => {
    setAmo(localStorage.getItem('amo'))
  }, [])

    //the below controls the loading modal
    const [openx, setOpenx] = useState(false);
    const handleOpenx = () => setOpenx(true);
    const handleClosex = () => setOpenx(false);

    //the end of thellaoding modal control
  return (
    <Cover>
        <Loading open={openx} handleClose={handleClosex} />
      <Stack direction='column' alignItems='center' justifyContent='center' sx={{ minHeight: '90vh', padding: '12px', position: 'relative' }}>
        <Stack sx={{ minWidth: '240px', height: '305px', padding: '8px' }} alignItems='center' justifyContent='center'>
          <Image src={WS} width={150} height={156} alt='ws' />
          <Typography sx={{ fontSize: '18px', fontWeight: '600', color: '#CACACA' }}>Deposit Successful</Typography>
          <Typography id="modal-modal-description" sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#cacaca', mt: 2, fontSize: '14px', fontWeight: '300' }}>
            You have successfully deposited {amo} USDT to your account
          </Typography>
        </Stack>
        <motion.p onClick={() => { router.push('/user/') }}
          whileTap={{ background: '#E94E55', color: '#373636', scale: 0.9 }}
          whileHover={{ background: '#E94E55', color: '#373636', scale: 1.1 }}
          style={{ fontWeight: '500', fontSize: '12px', color: 'white', padding: '10px', background: '#373636', border: '0.6px solid #E94E55', width: '50vw', textAlign: 'center', cursor: 'pointer', borderRadius: '5px' }}>
          Continue </motion.p>
      </Stack>

    </Cover>
  )
}