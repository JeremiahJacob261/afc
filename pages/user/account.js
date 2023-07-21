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


export default function Account() {
  const auth = getAuth(app);
  const router = useRouter()
  const [info, setInfo] = useState({});
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
const handleClick = () => {
  setOpened(true);
};
  //end of snackbar1
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('userId', user.uid)
          setInfo(data[0])
    setBalance(data[0].balance);
        }
        GET();
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });
   
  }, [info]);

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
        <title>{info.username}&lsquo; Account</title>
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ padding: "8px", background: "#03045E",width:'100%',minHeight:'80vh' }}>
        <div sx={{ padding: "8px", background: "none" }} >
          <Stack>
            <Avatar>{info.username}</Avatar>
            <Typography variant="h4" sx={{ color: "white", fontFamily: 'PT Sans, sans-serif' }}>Welcome, {info.username}</Typography>
          </Stack>
          <Typography sx={{ color: "white", fontFamily: 'PT Sans, sans-serif' }}>{balance} USDT</Typography>
        </div>
        <div sx={{ background: "none" }} >
          <Stack direction="column" sx={{ background: "none", padding: "8px" }} >
            <Stack direction="row" >
              <Typography sx={{ padding: "6px", cursor: "pointer", fontSize: "14px", color: "white", fontFamily: 'PT Sans, sans-serif' }} >Invite Code : https://afcfifa.com/register/{info.newrefer}</Typography>
              <ContentPasteIcon sx={{ color: "white" }} onClick={() => {
                navigator.clipboard.writeText("https://afcfifa.com/register/" + info.newrefer)
                setMessages("Invite Link Copied")
                handleClick();
              }} /></Stack>
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
                router.push("/user/transaction")
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
            < Link href='https://t.me/+tlIgo-59H4A1NjRk'> <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            > Join Our Telegram Group {
                //ellacruizfred60
              }</Typography></Link>
           <Divider/>
            <Typography sx={{ background:'#1A1B72',padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }} onClick={() => {
              
              signOut(auth).then(()=>{
          
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
