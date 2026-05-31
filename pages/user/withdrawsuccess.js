import { Stack, Button, Typography } from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import WS from '@/public/icon/wsuccess.png'
export default function Wsuccess() {
  const router = useRouter();
  return (
    <Cover>
      <Stack direction='column' alignItems='center' justifyContent='center' sx={{ minHeight: '90vh', padding: '12px', position: 'relative' }}>
        <Stack sx={{ width: '240px', height: '305px', padding: '8px' }} alignItems='center' justifyContent='center'>
          <Image src={WS} width={150} height={156} alt='ws' />
          <Typography sx={{ fontSize: '18px', fontWeight: '600', color: '#E9E5DA' }}>Withdrawal Success</Typography>
          <Typography id="modal-modal-description" sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#E9E5DA' }}>
            Your Withdrawal Request is successfully sent
          </Typography>
        </Stack>


        <motion.p onClick={() => {

          router.push('/user/account')
        }}
          whileTap={{ background: '#E9E5DA', color: '#06101F', scale: 0.9 }}
          whileHover={{ background: '#E9E5DA', color: '#06101F', scale: 1.1 }}
          style={{ fontWeight: '500', fontSize: '12px', color: 'white', padding: '10px', background: '#1BB6FF', border: '0.6px solid #10284D', width: '30vh', textAlign: 'center', cursor: 'pointer', borderRadius: '5px' }}>
          COMPLETE !</motion.p>

      </Stack>

    </Cover>
  )
}