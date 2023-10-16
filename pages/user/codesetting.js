import Cover from "./cover";
import { Stack,Typography,TextField,Button,Divider }   from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import Big from '../../public/icon/badge.png'
import Modal from '@mui/material/Modal';
import Wig from '../../public/icon/wig.png'
import Image from 'next/image'
import { supabase } from "../api/supabase";
export default function Code(){
    const [pin,setPin] = useState('')
    const [cpin,setCPin] = useState('')
    const [name,setName] = useState('')
    const router = useRouter();
    const [open,setOpen] = useState(false)
    const [ale,setAle] = useState(false)
    const [aleT,setAleT] = useState(false)
    const Alerts = (m,t) =>{
        setAle(m)
        setAleT(t)
        setOpen(true)
      }
    useEffect(()=>{
        setName(localStorage.getItem('signNames'));
    },[])
    const nextPage = () => {
        if(pin === cpin){
            async function Update() {
                const { data,error} = await supabase
                .from('users')
                .update(
                  {
                    'pin':pin,
                    'codeset':true
                  })
                .eq('username',name);
                Alerts('You have successfully set a new Pin',true)
            }
            Update();
        }else{
           Alerts('Make the Both Pins are Correct',false);
        }
    }
    return(
        <Cover>
            <Alertz/>
            <Stack direction='column' alignItems='center' sx={{minHeight:'90vh'}} spacing={2}>
            <Stack direction='row' alignItems='start' spacing={1} sx={{ padding: '8px', margin: '2px',minWidth:'343px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Deposit</Typography>
      </Stack>
      <Stack direction='row' justifyContent='center' alignItems='center' sx={{height:'58px',background:'#FBEFEF',borderRadius:'5px',padding:'16px',maxWidth:'344px'}} spacing={2}>
      <PriorityHighRoundedIcon sx={{color:'#E5E7EB',background:'#E94E55',width:'20px',height:'20px',borderRadius:'10px'}}/>
      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#E94E55' }}>Please note that whatever pin you set is what you will always use to make withdrawals</Typography>
      </Stack>
      <Stack spacing={1} sx={{minWidth:'344px'}}> 
            <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Enter Pin </Typography>
            <TextField 
            sx={{color:'#03045E'}}
            value={pin}
            label='Enter Pin'
            type='password'
            onChange={(p)=>{
                setPin(p.target.value)
            }}
            />
            </Stack>
            <Stack spacing={1} sx={{minWidth:'344px'}}> 
            <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Confirm Pin </Typography>
            <TextField 
            sx={{color:'#03045E'}}
            label='Enter Pin'
            type='password'
            value={cpin}
            onChange={(p)=>{
                setCPin(p.target.value)
            }}
            />
            </Stack>
            <Button variant='contained' sx={{position:'absolute',bottom:100,fontFamily:'Poppins,sans-serif',color:'#E5E7EB',background:'#03045E',padding:'8px',minWidth:'343px',height:'50px'}} onClick={nextPage}>Continue</Button>
            </Stack>
        </Cover>
    )
    function Alertz(){
        return(
        <Modal
      open={open}
      onClose={()=>{
        if(aleT){
          setOpen(false)
        }else{
          setOpen(false)
        }
        }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Stack alignItems='center' justifyContent='space-evenly' sx={{background:'#E5E7EB',width:'290px',height:'330px',borderRadius:'20px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding:'12px'
    }}>
      <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh'/>
        <Typography id="modal-modal-title" sx={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:'500'}}>
        
         {aleT ? 'Success' : 'Eh Sorry!'}
        </Typography>
        <Typography id="modal-modal-description" sx={{fontFamily:'Poppins,sans-serif',mt: 2,fontSize:'14px',fontWeight:'300'}}>
         {ale}
        </Typography>
        <Divider sx={{background:'black'}}/>
        <Button variant='contained' sx={{fontFamily:'Poppins,sans-serif',color:'#E5E7EB',background:'#03045E',padding:'8px',width:'100%'}} onClick={()=>{
          if(aleT){
            setOpen(false)
            router.push('/user/account')
          }else{
            setOpen(false)
          }
            
        }}>Okay</Button>
      </Stack>
        
    </Modal>)
      }
}