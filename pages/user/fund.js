import {Stack,Button, Typography} from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import WS from '../../public/icon/vault.png'
import Head from 'next/head'
export default function Funds() {
  const router = useRouter();
    return(
        <Cover>
            <Head>
          <title>Deposit - Enter Amount</title>
          <link rel="icon" href="/brentford.ico" />
        </Head>
        <Stack direction='column' justifyContent='center' alignItems='center' sx={{minHeight:'90vh',padding:'12px',position:'relative'}} spacing={3}>
            <Stack sx={{width:'240px',height:'305px',padding:'8px'}} alignItems='center' justifyContent='center' spacing={2}>
                 <Image src={WS} width={250} height={115} alt='ws'/>
         <Typography sx={{fontSize:'18px',fontWeight:'600',color:'#CACACA'}}>Make a Deposit</Typography>
         <Typography id="modal-modal-description" sx={{color:'#cacaca',textAlign:'center',fontFamily:'Poppins,sans-serif',fontSize:'18px',fontWeight:'300'}}>
         Deposit money into your account in 3 easy steps with any payment method of your choice
    </Typography>
            </Stack>
        <motion.div whileTap={{ scale:1.05 }} style={{ display:'flex',flexDirection:'row',cursor:'pointer', alignItems:'center',borderRadius:'8px', justifyContent:'center',   color: "#CACACA", height: '50px', background: '#373636',minWidth:'310px',padding:'12px' }} onClick={()=>{
     
        router.push('/user/transaction')
      
    }}>Get Started</motion.div>
        </Stack>
        
        </Cover>
    )
}