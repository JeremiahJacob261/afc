import { Avatar, Paper, Typography, Box, Stack, Button, Divider } from '@mui/material'
import Cover from './cover'
import React, { useContext, useEffect, useState } from "react";
import { AppContext, SlipContext, BetContext } from "../api/Context";
import { getCookies, getCookie, setCookies, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/router'
import Link from 'next/link';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { supabase } from '../api/supabase'
import Head from 'next/head';


export default function Account() {
  const router = useRouter()
  const [info, setInfo] = useState({});
  const { bets, setBets } = useContext(BetContext);
  const { slip, setSlip } = useContext(SlipContext)
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
    if (localStorage.getItem('me') === null) {
      router.push("/login")
    }else{
    const GET = async () => {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('username', localStorage.getItem('me'))
      setInfo(data[0])
setBalance(data[0].balance);
    }
    GET();
  }
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
      <Box sx={{ padding: "8px", background: "#4054A0" }}>
        <Paper sx={{ padding: "8px", background: "none" }} elevation={4}>
          <Stack>
            <Avatar>{info.username}</Avatar>
            <Typography variant="h4" sx={{ color: "white", fontFamily: 'PT Sans, sans-serif' }}>Welcome, {info.username}</Typography>
          </Stack>
          <Typography sx={{ color: "white", fontFamily: 'PT Sans, sans-serif' }}>{balance} USDT</Typography>
        </Paper>
        <Paper sx={{ background: "none" }} elevation={5}>
          <Stack direction="column" sx={{ background: "none", padding: "8px" }} >
            <Stack direction="row" >
              <Typography sx={{ padding: "6px", cursor: "pointer", fontSize: "14px", color: "white", fontFamily: 'PT Sans, sans-serif' }} >Invite Code : https://afcfifa.com/register/{info.newrefer}</Typography>
              <ContentPasteIcon sx={{ color: "white" }} onClick={() => {
                navigator.clipboard.writeText("https://afcfifa.com/register/" + info.newrefer)
                setMessages("Invite Link Copied")
                handleClick();
              }} /></Stack>
            <Divider />

            <Typography sx={{ padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            onClick={()=>{
              router.push("/user/refferal")
            }}
            >Referral Details </Typography> <Divider />
            <Typography sx={{ padding: "6px", color: "white", fontSize: "14px", cursor: "pointer", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/deposit")
              }
              }
            >Deposit</Typography>
            <Divider />
            <Typography sx={{ padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/withdraw")
              }
              }
            >WithDrawal</Typography>
            <Divider />
            <Typography sx={{ padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/bets")
              }
              }>
              My Bets</Typography>
            <Divider />
            <Typography sx={{ padding: "6px", color: "white", fontSize: "14px", cursor: "pointer", fontFamily: 'PT Sans, sans-serif' }}
              onClick={() => {
                router.push("/user/transaction")
              }
              }
            >Transaction History</Typography>
            <Divider />
            < Link href='https://t.me/+geclbC4mphg2ZmU0'> <Typography sx={{ padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }}
            > Contact Us on Telegram @AFC_customerservice{
                //ellacruizfred60
              }</Typography></Link>
           
            <Typography sx={{ padding: "6px", cursor: "pointer", color: "white", fontSize: "14px", fontFamily: 'PT Sans, sans-serif' }} onClick={() => {
              deleteCookie('logged')
              router.push("/login")
              setInfo({})
              setBets([])
              setSlip(0)
            }
            }>Log Out</Typography>
          </Stack>
        </Paper>
      </Box>
    </Cover>
  )
}