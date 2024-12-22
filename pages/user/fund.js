import {Stack,Button, Typography} from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import WS from '../../public/icon/vault.png'
import Head from 'next/head'
import Loading from "@/pages/components/loading";
export default function Funds() {
  const router = useRouter();
      //the below controls the loading modal
      const [openx, setOpenx] = useState(false);
      const handleOpenx = () => setOpenx(true);
      const handleClosex = () => setOpenx(false);
  
      //the end of thellaoding modal control
    return(
        <Cover>
            <Head>
          <title>Deposit - Enter Amount</title>
          <link rel="icon" href="/bradford.ico" />
        </Head>
        <Loading open={openx} handleClose={handleClosex} />
        <Stack direction='column' justifyContent='center' alignItems='center' sx={{minHeight:'95vh',padding:'12px',position:'relative'}} spacing={3}>
            <Stack sx={{width:'240px',height:'305px',padding:'8px'}} alignItems='center' justifyContent='center' spacing={2}>
                 <Image src={WS} width={250} height={115} alt='ws'/>
         <Typography sx={{fontSize:'18px',fontWeight:'600',color:'#CACACA'}}>Make a Deposit</Typography>
         <Typography id="modal-modal-description" sx={{color:'#cacaca',textAlign:'center',fontFamily:'Poppins,sans-serif',fontSize:'18px',fontWeight:'300'}}>
         Deposit money into your account in 3 easy steps with any payment method of your choice
    </Typography>
            </Stack>
        <motion.div whileTap={{ scale:1.05 }} style={{ cursor:'pointer',border:'0.6px solid #373636',display:'flex',flexDirection:'row',cursor:'pointer', alignItems:'center',borderRadius:'8px', justifyContent:'center',   color: "#CACACA", height: '50px', background: '#E94E55',minWidth:'310px',padding:'12px' }} onClick={()=>{
          handleOpenx()
        router.push('/user/transaction')
      
    }}>Get Started</motion.div>
        </Stack>
        
        </Cover>
    )
}