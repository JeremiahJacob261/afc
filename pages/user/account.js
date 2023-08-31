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
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import MoneyIcon from '@mui/icons-material/Money';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PaymentsIcon from '@mui/icons-material/Payments';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import TimerIcon from '@mui/icons-material/Timer';
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
        <div sx={{ padding: "8px", background: "none" }} >
          <Stack direction='row' spacing={2}>
            <Avatar>{info ? `${info.username}` : 'Loading...'}</Avatar>
            <Stack direction='column'>
               <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400', fontFamily: 'Poppins, sans-serif' }}>Hello {info ? ` ${info.username}` : 'Loading...'}</Typography>
            <Typography sx={{ color: "black",fontSize:'16px',fontWeight:'400', fontFamily: 'Poppins, sans-serif' }}>Level 1</Typography>
            </Stack>
           </Stack>
           <Stack direction='row' justifyContent='space-between' sx={{margin:'8px'}}>
            <Stack>
              <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px',  width: '100%', color: 'black' }}>Current Balance </Typography>
              <Typography style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'Poppins, sans-serif', height: '24px', width: '100%', color: 'black' }}>{balance.toFixed(3)} USDT</Typography>
            </Stack>
            <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#E6E8F3', borderRadius: '20px', padding: '8px', width: '95px',height:'32px' }}>
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300px', color: 'black', fontSize: '12px' }}>
                Deposit
              </Typography>
              <KeyboardArrowRightIcon sx={{width:'16px',height:'16px'}}/>
            </Stack>
          </Stack>
          <Typography style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', width: '100%', color: 'black' }}>Referral</Typography>
          <Divider sx={{background:'black'}}/>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}}>
        <LinkIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>https://afcfifa.com/register/{info ? `${info.newrefer}` : 'Loading...'}</Typography>
        <ContentCopyIcon color='black' sx={{width:'24px',height:'24px'}} onClick={() => {
                navigator.clipboard.writeText("https://afcfifa.com/register/" + info.newrefer)
                setMessages("Invite Link Copied")
                setOpened(true);
              }}/>
          </Stack>

          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} onClick={()=>{
              router.push("/user/refferal")
            }}>
            <Stack direction='row' spacing={1}  alignItems='center'><SportsKabaddiIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>All Referrals</Typography>
        </Stack>
        <KeyboardArrowRightIcon color='black' sx={{width:'24px',height:'24px'}}/>
          </Stack>

          <Typography style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', width: '100%', color: 'black' }}>Deposit</Typography>
          <Divider sx={{background:'black'}}/>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}}>
            <Stack direction='row' spacing={1}  alignItems='center' onClick={() => {
                router.push("/user/deposit")
              }}>
              <MoneyIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>Fund Account</Typography>
        </Stack>
        <KeyboardArrowRightIcon color='black' sx={{width:'24px',height:'24px'}}/>
          </Stack>

          <Typography style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', width: '100%', color: 'black' }}>WithDrawal</Typography>
          <Divider sx={{background:'black'}}/>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} onClick={() => {
                router.push("/user/withdraw")
              }
              }>
            <Stack direction='row' spacing={1}  alignItems='center'><PaymentsIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>Withdraw</Typography>
        </Stack>
        <KeyboardArrowRightIcon color='black' sx={{width:'24px',height:'24px'}}/>
          </Stack>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}} onClick={() => {
                router.push("/user/transaction")
              }
              }>
            <Stack direction='row' spacing={1}  alignItems='center'><TimerIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>History</Typography>
        </Stack>
        <KeyboardArrowRightIcon color='black' sx={{width:'24px',height:'24px'}}/>
          </Stack>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{padding:'8px'}}>
            <Stack direction='row' spacing={1}  alignItems='center'><SportsKabaddiIcon color='black' sx={{width:'24px',height:'24px'}}/>
        <Typography style={{ fontSize: '14px', fontWeight: '200', fontFamily: 'Poppins, sans-serif', color: 'black' }}>Code Setting</Typography>
        </Stack>
        <KeyboardArrowRightIcon color='black' sx={{width:'24px',height:'24px'}}/>
          </Stack>
        </div>
        <div sx={{ background: "none" }} >
          <Stack direction="column" sx={{ background: "none", padding: "8px" }} >
            <Stack direction="row" >
              <Typography sx={{ padding: "6px", cursor: "pointer", fontSize: "14px", color: "white", fontFamily: 'PT Sans, sans-serif' }} >Invite Code : https://afcfifa.com/register/{info ? `${info.newrefer}` : 'Loading...'}</Typography>
              <ContentPasteIcon sx={{ color: "white" }}  /></Stack>
            <Divider />

            <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            onClick={()=>{
              router.push("/user/refferal")
            }}
            >Referral Details </Typography> <Divider />
            <Typography sx={{ background:'#1A1B72',padding: "6px", color: "white", fontSize: "14px", cursor: "pointer", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/deposit")
              }
              }
            >Deposit</Typography>
            <Divider />
            <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/withdraw")
              }
              }
            >WithDrawal</Typography>
            <Divider />
            <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/bets")
              }
              }>
              My Bets</Typography>
              <Divider />
            <Typography sx={{ background:'#1A1B72',padding: "6px", color: "white", fontSize: "14px", cursor: "pointer", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/faq")
              }
              }
            >FAQ</Typography>
            <Divider />
            <Typography sx={{ background:'#1A1B72',padding: "6px", color: "white", fontSize: "14px", cursor: "pointer", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/transaction")
              }
              }
            >Transaction History</Typography>
            <Divider />
            < Link href='https://t.me/AFC_Customerservice1'> <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            > Contact Us on Telegram @AFC_Customerservice1{
                //ellacruizfred60
              }</Typography></Link>
           <Divider />
            < Link href='https://t.me/+P9bW6kwPJ9pjZmZh'> <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            > Join Our Telegram Group {
                //ellacruizfred60
              }</Typography></Link>
           <Divider/>
            <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }} onClick={() => {
              
              signOut(auth).then(()=>{
                localStorage.removeItem('signRef');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
                router.push('/login');
              })
            }
            }>Log Out</Typography>
          </Stack>
        </div>
      </Box>
    </Cover>
  )
}

// export async function getServerSideProps(){
//   const auth = getAuth(app);
//   onAuthStateChanged(auth, (user) => {
//     if (user) {
//       // User is signed in, see docs for a list of available properties
//       // https://firebase.google.com/docs/reference/js/auth.user
//       const uid = user;
//       // ...
    
//        const Get=async()=>{
//           const { data, error } = await supabase
//           .from('users')
//           .select()
//           .eq('userId', user.uid)
//           let datas = data[0];
//           return datas;
//         }
//     } else {
//       // User is signed out
//       // ...
//       console.log('sign out');
//       redirect('/login')
//     }

//   });
//   return { props: { Get } }
// }