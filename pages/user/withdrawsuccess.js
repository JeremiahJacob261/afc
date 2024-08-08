import {Stack,Button, Typography} from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { useRouter } from 'next/router'
import WS from '../../public/icon/wsuccess.png'
export default function Wsuccess() {
  const router = useRouter();
    return(
        <Cover>
        <Stack direction='column' alignItems='center' justifyContent='center' sx={{minHeight:'90vh',padding:'12px',position:'relative'}}>
            <Stack sx={{width:'240px',height:'305px',padding:'8px'}} alignItems='center' justifyContent='center'>
                 <Image src={WS} width={150} height={156} alt='ws'/>
         <Typography sx={{fontSize:'18px',fontWeight:'600',color:'E9E5DA'}}>Withdrawal Success</Typography>
         <Typography id="modal-modal-description" sx={{textAlign:'center',fontFamily:'Poppins,sans-serif',mt: 2,fontSize:'14px',fontWeight:'300'}}>
         Your Withdrawal Request is successfully sent
    </Typography>
            </Stack>
        <Button variant='contained' sx={{position:'absolute',bottom:100,fontFamily:'Poppins,sans-serif',color:'#242627',background:'#03045E',padding:'8px',width:'343px',height:'50px'}} onClick={()=>{
     
        router.push('/user/account')
      
    }}>Continue</Button>
        </Stack>
        
        </Cover>
    )
}