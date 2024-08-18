import Cover from "./cover";
import { Stack, Typography, TextField, Button, Divider } from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from 'framer-motion'
import Modal from '@mui/material/Modal';
import Wig from '../../public/icon/wig.png'
import Image from 'next/image'
import Loading from "@/pages/components/loading";
import toast,{ Toaster } from "react-hot-toast";
import { supabase } from "../api/supabase";
 
export async function getServerSideProps(context) {
  const met = context.query.dm;
  const { data, error } = await supabase
    .from('walle')
    .select('*')
    .eq('currency_code', met)

  return {
    props: {
      method: data[0],
      // Will be passed to the page component as props
    },
  }
}
export default function InputValue({ method }) {
  const router = useRouter();
  const [ale, setAle] = useState('')
  const [open, setOpen] = useState(false)
  const [aleT, setAleT] = useState(false)
  const [amount, setAmount] = useState('')
  // const [method, setMethod] = useState();
    //the below controls the loading modal
    const [openx, setOpenx] = useState(false);
    const handleOpenx = () => setOpenx(true);
    const handleClosex = () => setOpenx(false);
  
    //the end of thellaoding modal control
  const Alerts = (m, t) => {
    setAle(m)
    setAleT(t)
    setOpen(true)
  }
  const nextPage = () => {
    console.log('...')
    if(amount/method.rates < 5){
      toast.error('Minimum deposit is ' + (method.rates * 5) + ' ' + method.currency_code.toUpperCase());
    }else{
      localStorage.setItem('amo',amount);
      handleOpenx()
      if(method.currency_code === 'fcfa'){
      let trf = localStorage.getItem('dmmv')
      router.push('/user/address?dm=' + method.currency_code + '&trf=' + trf)
      }else{
        
      router.push('/user/address?dm=' + method.currency_code)
      }
    }

  }
  // useEffect(() => {
  //   setMethod(localStorage.getItem('dm'));
  // }, [])

  return (
    <Cover>
      <Alertz />
      <Loading open={openx} handleClose={handleClosex} />
      <Stack direction='column' alignItems='center' sx={{ minHeight: '80vh' }} spacing={2}>
      <Toaster position="bottom-center"
        reverseOrder={false} />
     

        <Stack direction='row' alignItems='start' spacing={1} sx={{ padding: '8px', margin: '2px', minWidth: '343px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#cacaca' }} onClick={() => {
            router.push('/user/transaction')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#cacaca' }}>Deposit</Typography>
        </Stack>
        {
          (method.currency_code != 'usdt') ? 
          <Stack sx={{ minWidth: '350px', minHeight: 'auto', background: '#373636', padding: '8px', borderRadius: '5px' }} direction='column' spacing={2} justifyContent='center'>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Amount in USDT</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{(amount/method.rates).toFixed(3)} USDT</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Amount in {method.currency_code.toUpperCase()}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{amount} {method.currency_code.toUpperCase()}</Typography>
          </Stack>
        </Stack>

        :
        <></>
        }
        <Stack direction='row' justifyContent='center' alignItems='center' sx={{width:'350px', height: '58px', background: '#FBEFEF', borderRadius: '5px', padding: '16px' }} spacing={2}>
          <PriorityHighRoundedIcon sx={{ color: '#242627', background: '#E94E55', width: '20px', height: '20px', borderRadius: '10px' }} />
          <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#E94E55' }}>Please note that the minimum deposit is {5 * method.rates ?? 1} {(method.name ?? 'usdt').toUpperCase()}</Typography>
        </Stack>
        <Stack spacing={1} sx={{ minWidth: '344px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Enter Amount </Typography>
          <TextField
            sx={{ color: '#242627', width: '360px', input: { color: '#f5f5f5' }, border: '1px solid #cacaca', borderRadius: '5px' }}
            type="number"
            value={amount}
            onChange={(a) => {
              setAmount(a.target.value);
            }} />
        </Stack>
        <motion.div whileTap={{ scale: 1.05 }} style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: "#CACACA", height: '50px', background: '#E94E55', minWidth: '360px', padding: '12px' }} onClick={() => {

          nextPage()

        }}>Continue</motion.div> </Stack>
    </Cover>
  )
  function Alertz() {
    return (
      <Modal
        open={open}
        onClose={() => {
          if (aleT) {
            setOpen(false)
            router.push('/user/withdrawsuccess')
          } else {
            setOpen(false)
          }
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack alignItems='center' justifyContent='space-evenly' sx={{
          background: '#242627', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#cacaca' }}>

            {aleT ? 'Success' : 'Eh Sorry!'}
          </Typography>
          <Typography id="modal-modal-description" sx={{ fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#cacaca' }}>
            {ale}
          </Typography>
          <Divider sx={{ color: '#CACACA' }} />
          <motion.div whileTap={{ scale: 1.05 }} style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: "#CACACA", height: '50px', background: '#373636', minWidth: '310px', padding: '12px' }} onClick={() => {
            setOpen(false)
          }}>Okay</motion.div>

        </Stack>

      </Modal>)
  }
}