import Cover from "./cover";
import { Stack,Typography,TextField,Button,Divider }   from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Modal from '@mui/material/Modal';
import Wig from '../../public/icon/wig.png'
import Image from 'next/image'
export default function InputValue() {
    const router = useRouter();
    const [ale,setAle] = useState('')
    const [open,setOpen] = useState(false)
    const [aleT,setAleT] = useState(false)
    const [amount,setAmount] = useState('')
    const [method,setMethod] = useState();
    const Alerts = (m,t) =>{
        setAle(m)
        setAleT(t)
        setOpen(true)
      }
    const nextPage =()=>{
            console.log('...')
            if(method === 'usdt'){
              if( amount.length < 1 || amount < 10 ){
                Alerts((method === 'usdt') ? 'Please Input any Amount above 9 USDT' : (method === 'gpay') ? 'Please Input any Amount above 829 Indian Rupees' : 'Please Input any Amount above 208 Zambian Kwacha',false)
            }else{
              localStorage.setItem('amo',amount)
                router.push('/user/deposit')
            }
            }else{
             if(method === 'gpay'){
              if( amount.length < 1 || amount < 830 ){
                Alerts((method === 'usdt') ? 'Please Input any Amount above 9 USDT' : (method === 'gpay') ? 'Please Input any Amount above 829 Indian Rupees' : 'Please Input any Amount above 209 Zambian Kwacha',false)
              }else{
              localStorage.setItem('amo',amount)
                router.push('/user/deposit')
            }
             }else{
              if( amount.length < 1 || amount < 210 ){
                Alerts((method === 'usdt') ? 'Please Input any Amount above 9 USDT' : (method === 'gpay') ? 'Please Input any Amount above 829 Indian Rupees' : 'Please Input any Amount above 209 Zambian Kwacha',false)
              }else{
              localStorage.setItem('amo',amount)
                router.push('/user/deposit')
            }
             }
            }
        
    }
    useEffect(()=>{
      setMethod(localStorage.getItem('dm'));
    },[])
    return(
        <Cover>
            <Alertz/>
            <Stack direction='column' alignItems='center' sx={{minHeight:'90vh'}} spacing={2}>
            <Stack direction='row' alignItems='start' spacing={1} sx={{ padding: '8px', margin: '2px',minWidth:'343px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/transaction')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Deposit</Typography>
      </Stack>
      <Stack direction='row' justifyContent='center' alignItems='center' sx={{height:'58px',background:'#FBEFEF',borderRadius:'5px',padding:'16px'}} spacing={2}>
      <PriorityHighRoundedIcon sx={{color:'#242627',background:'#E94E55',width:'20px',height:'20px',borderRadius:'10px'}}/>
      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#E94E55' }}>Please note that the minimum deposit is {(method === 'usdt') ? '10 USDT' : (method === 'gpay') ? '830 Indian Rupees' : '210 Zambian Kwacha'}</Typography>
      </Stack>
      <Stack spacing={1} sx={{minWidth:'344px'}}> 
            <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'E9E5DA'}}>Enter Amount </Typography>
            <TextField 
            sx={{color:'#03045E'}}
            type="number"
            value={amount}
            onChange={(a) => {
              setAmount(a.target.value);
            }}/>
            </Stack>
            <Button variant='contained' sx={{position:'absolute',bottom:100,fontFamily:'Poppins,sans-serif',color:'#242627',background:'#03045E',padding:'8px',minWidth:'343px',height:'50px'}} onClick={nextPage}>Continue</Button>
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
          router.push('/user/withdrawsuccess')
        }else{
          setOpen(false)
        }
        }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Stack alignItems='center' justifyContent='space-evenly' sx={{background:'#242627',width:'290px',height:'330px',borderRadius:'20px',
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
        <Divider sx={{background:'E9E5DA'}}/>
        <Button variant='contained' sx={{fontFamily:'Poppins,sans-serif',color:'#242627',background:'#03045E',padding:'8px',width:'100%'}} onClick={()=>{
          
            setOpen(false)
        }}>Okay</Button>
      </Stack>
        
    </Modal>)
      }
}