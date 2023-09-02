import {Stack,Button, Typography} from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { useRouter } from 'next/router'
import WS from '../../public/icon/vault.png'
export default function Funds() {
  const router = useRouter();
    return(
        <Cover>
        <Stack direction='column' justifyContent='center' alignItems='center' sx={{minHeight:'90vh',padding:'12px',position:'relative'}}>
            <Stack sx={{width:'240px',height:'305px',padding:'8px'}} alignItems='center' justifyContent='center' spacing={2}>
                 <Image src={WS} width={250} height={115} alt='ws'/>
         <Typography sx={{fontSize:'18px',fontWeight:'600',color:'black'}}>Make a Deposit</Typography>
         <Typography id="modal-modal-description" sx={{textAlign:'center',fontFamily:'Poppins,sans-serif',fontSize:'18px',fontWeight:'300'}}>
         Deposit money into your account in 3 easy steps
    </Typography>
            </Stack>
        <Button variant='contained' sx={{position:'absolute',bottom:100,fontFamily:'Poppins,sans-serif',color:'white',background:'#03045E',padding:'8px',width:'343px',height:'50px'}} onClick={()=>{
     
        router.push('/user/transaction')
      
    }}>Get Started</Button>
        </Stack>
        
        </Cover>
    )
}