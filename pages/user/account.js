import { Avatar, Paper, Typography, Box, Stack, Button, Divider } from '@mui/material'
import Cover from './cover'
import React, { useContext, useEffect, useState } from "react";
import { getCookies, getCookie, setCookies, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/router'
import Link from 'next/link';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { supabase } from '../api/supabase'
import Head from 'next/head';
import Image from 'next/image';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import iLink from '../../public/icon/ant-design_link-outlined.png'
import iCopy from '../../public/icon/ion_copy.png'
import iNT from '../../public/icon/inter.png'
import St from '../../public/icon/steam.png'
import Lk from '../../public/icon/lock.png'
import Sw from '../../public/icon/steamw.png'
import Vec from '../../public/icon/Vector.png'
import Bt from '../../public/icon/bet.png'
import Ot from '../../public/icon/out.png'
import Tel from '../../public/icon/tel.png'
import Fq from '../../public/icon/faq.png'
export default function Account() {
  const auth = getAuth(app);
  const router = useRouter()
  const [info, setInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false)
const handleClosed = (event, reason) => {
  if (reason === 'clickaway') {
    return;
  }
  setOpened(false);
};
let loads = 0;
  //end of snackbar1
  useEffect(() => {
    const useri =  localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid =  localStorage.getItem('signUid');
      const name =  localStorage.getItem('signName');
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
       console.log('...')
        // ...
        if(loads === 0){
          loads++;
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('userId',uid)
          setInfo(data[0])
          setBalance(data[0].balance);
          localStorage.setItem('signRef',data[0].newrefer);
        }
        GET();
        }
        
      } else {
        // User is signed out
        // ...
        signOut(auth);
        console.log('sign out');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
  
   
  }, [balance]);

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
  //snackbar2

  function Sncks() {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
        <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
         Invite Link Copied
        </Alert>
      </Snackbar>
    )
  }
  //end of snackbar2
  return (
    <Cover style={{ width: "100%" }}>
      <Sncks />
      <Head>
        <title>{info ? `${info.username}` : 'Loading...'}&lsquo; Account</title>
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ padding: "8px", background: "#FFFFFF",width:'100%',minHeight:'80vh' }}>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '5px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Profile</Typography>
      </Stack>
      {
        //start of profile
      }
      <Stack spacing={4} sx={{minWidth:'344px'}}>
          <Stack direction='row' spacing={2}>
            <Avatar>{info ? `${info.username}` : 'Loading...'}</Avatar>
            <Stack direction='column'>
               <Typography sx={{ color: "black",fontSize:'14px',fontWeight:'500', fontFamily: 'Poppins, sans-serif' }}>Hello {info ? ` ${info.username}` : 'Loading...'}</Typography>
            <Typography sx={{ color: "black",fontSize:'14px',fontWeight:'300', fontFamily: 'Poppins, sans-serif' }}>Level 1</Typography>
            </Stack>
           </Stack>
           <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Stack>
              <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>Current Balance </Typography>
              <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>{info ? ` ${info.balance.toFixed(3)}` : '0' } USDT</Typography>
            </Stack>
            <Link href='/user/fund' style={{ textDecoration: "none",color:'black' }}>
            <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#E6E8F3', borderRadius: '20px', padding: '8px', width: '95px',height:'32px' }}>
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'black', fontSize: '12px' }}>
                Deposit
              </Typography>
              <KeyboardArrowRightIcon sx={{width:'16px',height:'16px'}}/>
            </Stack>
            </Link>
          </Stack>
           {
            //deposit
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>Referral</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}}> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={iLink} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>https://afcfifa/register/{info ? `${info.newrefer}` : 'Loading...'}</Typography>
          </Stack>
          <Image src={iCopy} width={20} height={20} alt='icopy' onClick={() => {
                navigator.clipboard.writeText("https://afcfifa.com/register/" + info.newrefer)
                setMessages("Invite Link Copied")
                setOpened(true);
              }}/>
           </Stack>

           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} 
           onClick={()=>{
            router.push('/user/refferal');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={iNT} width={24} height={24} alt='int'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>All Referral</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
        </Stack>
        {
          //end of deposit
        }
        {
            //fun
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>Deposit</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} onClick={()=>{
            router.push('/user/fund');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start' >
            <Image src={St} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',verticallyAlign:'center',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Fund Account</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
        </Stack>
        {
          //end of fund
        }
        {
            //withdraw
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>Withdrawal</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} onClick={()=>{
            router.push('/user/withdraw');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Sw} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Withdraw</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>

           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} onClick={()=>{
            router.push('/user/transaction');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Vec} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>History</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>

           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} onClick={()=>{
            router.push('/user/codesetting');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Lk} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Code Setting</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
        </Stack>
        {
          //end of withdraw
        }
        {
            //fun
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>Bets</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} onClick={()=>{
            router.push('/user/bets');
           }}> 
           <Stack direction='row' spacing={1} justifyContent='start' >
            <Image src={Bt} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',verticallyAlign:'center',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>My Bets</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
        </Stack>
        {
          //end of fund
        }
                {
            //About
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>About</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}}  onClick={() => {
                router.push("/user/faq")
              }
              }> 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Fq} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>FAQ</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
           
           < Link href='https://t.me/+P9bW6kwPJ9pjZmZh'>
           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} > 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Tel} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Telegram</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
           </Link>
           < Link href='https://t.me/AFC_Customerservice1'>
           <Stack direction='row' justifyContent='space-between' sx={{padding:'8px'}} > 
           <Stack direction='row' spacing={1} justifyContent='start'>
            <Image src={Tel} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Contact</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
           </Link>
        </Stack>
        {
          //end of About
        }
        {
            //close
           }
        <Stack direction='column'> 
           <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400',fontFamily:'Inter,sans-serif' }}>Closure</Typography>
           <Divider/>
           <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} 
           onClick={() => {
              
              signOut(auth).then(()=>{
                localStorage.removeItem('signRef');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
                router.push('/login');
              })
            }
            }> 
           <Stack direction='row' spacing={1} justifyContent='start' >
            <Image src={Ot} width={24} height={24} alt='ilink'/>
            <Typography sx={{ color:'black',verticallyAlign:'center',fontSize:'14px',fontWeight:300,fontFamily:'Inter,sans-serif'}}>Sign out</Typography>
          </Stack>
          <KeyboardArrowRightIcon width={24} height={24}/>
           </Stack>
        </Stack>
        {
          //end of close
        }
        </Stack>
        {
          //end of profile
        }
      </Box>
    </Cover>
  )
}