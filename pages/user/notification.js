import {Stack,Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {useRouter} from 'next/router';
import { useEffect,useState,useRef } from 'react';
import { supabase } from '../api/supabase';
import Head from 'next/head'
import Image from 'next/image'
import Rd from '../../public/icon/rounds.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
export default function Notification() {
    const router = useRouter();
    const [not,setNot] = useState([]);
    const [info,setInfo] = useState({});
    const isMounted = useRef(true);
    useEffect(()=>{
        const useri = localStorage.getItem('signedIn');
        if (useri) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/auth.user
    
          const uid = localStorage.getItem('signUid');
          const name = localStorage.getItem('signName');
          const ref = localStorage.removeItem('signRef');
          // ...
          if (isMounted.current) {
         
            async function GETs(){
              const { data, error } = await supabase
                .from('activa')
                .select()
                .or(`code.eq.${ref},code.eq.broadcast,username.eq.${name}`)
                .order('id', { ascending: false });
                setNot(data);
              console.log(data)
            }
            GETs();
            const GET = async () => {
              const { data, error } = await supabase
                .from('users')
                .select()
                .eq('username',name)
              setInfo(data[0])
            }
            GET();
              isMounted.current = false;
        }else{

        }
        }
        
    },[]);
      
    return(
        <Stack direction="column" sx={{minHeight:'80vh'}}>
          <Head>
          <title>Notifications</title>
          <link rel="icon" href="/logo_afc.ico" />
        </Head>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Notifications</Typography>
      </Stack>
      <Stack direction="row">
<Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500',padding:'8px' }}>Notification ({not.length})</Typography>
      
      </Stack>
                 <Stack direction='column'>
                 {
          not.map((r) => {
              if(r.type === 'bonus'){
                let date = new Date(r.created_at);
                let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
              return (

                <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                 <Image src={Rd} width={40} height={40} alt='rounds'/>
                 <Stack direction='column' sx={{width:'196px'}}>
<Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You Recieved Referral Bonus from {r.username} .
                  </Typography>
                  <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{r.amount} USDT</Typography>
                 </Stack>
                 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                </Stack>
            );    
              }else{
              if(r.username === info.username){
                let date = new Date(r.created_at);
                let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
                return (
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                  <Image src={Rd} width={40} height={40} alt='rounds'/>
                  <Stack direction='column' sx={{width:'196px'}}>
 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You Recieved {r.code} from admin  
                   </Typography>
                   <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{r.amount} USDT</Typography>
                  </Stack>
                  <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                 </Stack>
                )
              }else{ 
                if(r.code === 'bet-cancellation'){
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                  <Image src={Rd} width={40} height={40} alt='rounds'/>
                  <Stack direction='column' sx={{width:'196px'}}>
 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your Bet of {r.amount} was successfully cancelled
                   </Typography>
                  </Stack>
                  <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                 </Stack>
                }else{
                   let date = new Date(r.created_at);
                let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
                return (

                  <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                  <Image src={Rd} width={40} height={40} alt='rounds'/>
                  <Stack direction='column' sx={{width:'196px'}}>
 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>{r.username}
                   </Typography>
                  </Stack>
                  <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                 </Stack>
                );
                }
               
              }
                  
              }
            
          })
        }
                 </Stack>
        </Stack>
    )
}