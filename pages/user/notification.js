import {Stack,Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {useRouter} from 'next/router';
import { useEffect,useState,useRef } from 'react';
import { supabase } from '../api/supabase';
import { TbMailDollar } from 'react-icons/tb'
import NotificationsNoneSharpIcon from '@mui/icons-material/NotificationsNoneSharp';
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
          // ...
          if (isMounted.current) {
         
            const GET = async () => {
              const { data, error } = await supabase
                .from('users')
                .select()
                .eq('userId', uid)
              setInfo(data[0])
              console.log(data)
            }
            GET();
            
              isMounted.current = false;
        }else{

        }
        }
        
    },[]);
      async function GETs(){
      const { data, error } = await supabase
        .from('activa')
        .select()
        .eq('code',info.newrefer);
        setNot(data);
      console.log(data)
    }
    GETs();
    return(
        <Stack direction="column" sx={{height:'80vh'}}>
            <Stack direction="row"  alignItems='center' sx={{position:'top',top:'0',padding:'8px',background:'#1A1B72'}}>
                <ArrowBackIosNewIcon sx={{color:'white'}} onClick={()=>{
            router.push('/user');
          }}/>

                <Typography sx={{width:'100%',textAlign:'center',color:'#F5F5F5',fontSize: '24px', fontWeight: '800', margin: '4px', fontFamily: 'Poppins, sans-serif' }}>
                    NOTIFICATION
                </Typography>
                 </Stack>
                 <Stack direction='column'>
                 {
          not.map((r) => {
              if(r.type === 'bonus'){
              return (

                <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                  <TbMailDollar color="#EE8F00" />
                  <Typography style={{ color:'white',fontFamily: 'Poppins,sans-serif', fontSize: '15px', fontWeight: 'lighter' }}>You Recieved {r.amount} USDT from {r.username} as Referral Bonus.
                  </Typography>
                </Stack>
            );    
              }else{
                return (

                    <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                      <NotificationsNoneSharpIcon color="#EE8F00" />
                      <Typography style={{ color:'white',fontFamily: 'Poppins,sans-serif', fontSize: '15px', fontWeight: 'lighter' }}>You Recieved {r.amount} USDT from {r.username} as Referral Bonus.
                      </Typography>
                    </Stack>
                );  
              }
            
          })
        }
                 </Stack>
        </Stack>
    )
}