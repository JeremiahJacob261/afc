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
import profile from '@/public/prof.png'
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Icon } from '@iconify/react'

import toast,{ Toaster } from 'react-hot-toast';
export default function Account() {
  const auth = getAuth(app);
  const router = useRouter()
  const [info, setInfo] = useState([]);
  const [balance, setBalance] = useState(0);
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false);
  const [refCount, setRefCount] = useState(0);
  const [viplevel, setViplevel] = useState(1);
  const handleClosed = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpened(false);
  };
  let loads = 0;
  const [usern, setUsern] = useState('')
  const [userR, setUserR] = useState('')
  //end of snackbar1
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    setUsern(localStorage.getItem('signNames'));
    setUserR(localStorage.getItem('signRef'));
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      console.log('...')
      // ...

      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', localStorage.getItem('signNames'))
          setInfo(data[0])
          setBalance(data[0].balance);
          console.log(refCount)
          localStorage.setItem('signRef', data[0].newrefer);
          async function getReferCount() {
            try {
              const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .match({
                  'refer': localStorage.getItem('signRef'),
                  'firstd': true
                });
              setRefCount(count)
              console.log(info.totald)
              setViplevel((info.totald < 50 || count < 3) ? '1' : (info.totald < 100 || count < 5) ? '2' : (info.totald < 200 || count < 8) ? '3' : (info.totald < 300 || count < 12) ? '4' : (info.totald < 500 || count < 15) ? '5' : (info.totald < 1000 || count < 20) ? '6' : '7');
              console.log(count)
            } catch (e) {
              console.log(e)
            }
          }
          getReferCount();
        } catch (e) {
          console.log(e)
        }

      }
      GET();

    } else {
      // User is signed out
      // ...
      const sOut = async () => {
        const { error } = await supabase.auth.signOut();
        console.log('sign out');
        console.log(error);
        localStorage.removeItem('signedIns');
        localStorage.removeItem('signUids');
        localStorage.removeItem('signNames');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
      sOut();
    }
    console.log(info)
    //  console.log((info.totald < 20) ? '0' : (info.totald < 50) ? '1' : (info.totald < 100) ? '2' : (info.totald < 200) ? '3' : (info.totald < 300) ? '4' : (info.totald < 500) ? '5' : (info.totald < 1000) ? '6' : '7')

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
    <Cover style={{ width: "100%",paddingBottom:'100px' }}>
        <Toaster position="bottom-center"
                reverseOrder={false} />
      <Sncks />
      <Head>
        <title>{info ? `${info.username}` : 'Loading...'}&lsquo; Account</title>
        <link rel="icon" href="/brentford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ padding: "8px", background: "#242627", width: '100%', minHeight: '90vh',paddingBottom:'5vh' }}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '5px', margin: '2px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
            router.push('/user')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Profile</Typography>
        </Stack>
        {
          //start of profile
        }
        <Stack spacing={4} sx={{ minWidth: '344px' }}>
          <Stack spacing={1} sx={{ background:'#2D2F2F',padding:'8px',borderRadius:'5px'}}>
          <Stack direction='row' spacing={2} sx={{ padding:'8px'}} alignItems='center' justifyContent={"start"}>
            <Image src={profile} width={50} height={50}alt="profile"/>
            <Stack direction='column'>
              <Typography sx={{ color: "#FFFFFF", fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins, sans-serif' }}>Hello {info ? `${info.username}` : usern}</Typography>
              <Typography sx={{ color: "#CACACA", fontSize: '14px', fontWeight: '300', fontFamily: 'Poppins, sans-serif',  width: '50px', textAlign: 'start' }}>VIP {viplevel}</Typography>
            </Stack>
          </Stack>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{  padding: '8px', borderRadius: '10px' }}>
            <Stack>
              <Typography style={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#CACACA' }}>Current Balance </Typography>
              <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#CACACA' }}>{balance.toFixed(3)} USDT</Typography>
            </Stack>
            <Link href='/user/fund' style={{ textDecoration: "none", color: 'white' }}>
              <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#E94E55', borderRadius: '20px', padding: '8px', width: '95px', height: '32px' }}>
                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white', fontSize: '12px' }}>
                  Deposit
                </Typography>
                <KeyboardArrowRightIcon sx={{ width: '16px', height: '16px' }} />
              </Stack>
            </Link>
          </Stack>
          </Stack>
          {
            //deposit
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#E94E55", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>MY TEAM</Typography>
            <Divider />

            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', height: '110px', padding: '8px', background: '#242627', borderRadius: '8px' }}>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} alignItems="center">
                <Stack direction='row' spacing={1} justifyContent='center' alignItems="center">
                  <Icon icon="ant-design:link-outlined" width="24" height="24" style={{ color: "#a3a3a3" }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>https://www.bfc.com/register/{info ? info.newrefer : userR}</Typography>
                </Stack>
                <Icon icon="solar:copy-bold-duotone" width="24" height="24" style={{ color: '#a3a3a3' }} onClick={() => {
                  navigator.clipboard.writeText("https://www.bfc.com/register/" + info.newrefer)
                  setMessages("Invite Link Copied")
                  toast.success("Invite link copied")
                }} />
              </Stack>

              <Stack direction='row' justifyContent='space-between' alignItems={"center"} sx={{ padding: '8px' }}
                onClick={() => {
                  router.push('/user/refferal');
                }}>
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="carbon:diagram-reference" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>All Referral</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of deposit
          }
          {
            //fun
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#E94E55", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Deposit</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', height: '110px', padding: '8px', background: '#242627', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/fund');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems={"center"}>
                  <Icon icon="streamline:money-atm-card-3-deposit-money-payment-finance-atm-withdraw" width="24" height="24" style={{ color: "#a3a3a3" }} />
                  <Typography sx={{ color: '#CACACA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Fund Account</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/vip');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems={"center"}>
                  <Icon icon="icon-park-twotone:diamond-one" width="24" height="24" style={{ color: "#FFB400" }} />
                  <Typography sx={{ color: '#CACACA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>VIP Progress</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //withdraw
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#FFFFFF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Withdrawal</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '150px', padding: '8px', background: '#242627', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/withdraw');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="uil:money-withdraw" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Withdraw</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/transaction');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="ri:history-line" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>History</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Stack direction='row' justifyContent='space-between' alignItems="center" sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/codesetting');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="iconamoon:lock-light" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Code Setting</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Stack direction='row' justifyContent='space-between' alignItems="center" sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/bindwallet');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="icon-park-twotone:connect" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Link Wallets</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of withdraw
          }
          {
            //fun
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#FFFFFF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Bets</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#242627', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/bets');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="mdi:clipboard-text-history-outline" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>My Bets</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //About
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#FFFFFF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>About</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#242627', borderRadius: '8px' }}>

            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
              router.push("/user/faq")
            }
            }>
              <Stack direction='row' spacing={1} justifyContent='start'>
              <Icon icon="streamline:interface-help-question-circle-circle-faq-frame-help-info-mark-more-query-question" width="24" height="24" style={{ color: '#a3a3a3' }} />
                <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>FAQ</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>

            < Link href='https://t.me/+WJKvJKagKuozNzM8'>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                <Stack direction='row' spacing={1} justifyContent='start'>
                <Icon icon="mingcute:telegram-line" width="24" height="24" style={{ color: '#a3a3a3' }} />
             
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Telegram</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Link>
            < Link href='https://t.me/Afc _customercare'>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                <Stack direction='row' spacing={1} justifyContent='start'>
                <Icon icon="mdi:support" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Contact</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Link>
          </Stack>
          </Stack>
          {
            //end of About
          }
          {
            //close
          }
          <Stack direction='column' spacing={1} style={{ background: '#373636', padding: '12px', borderRadius: "5px" }}>
            <Typography sx={{ color: "#FFFFFF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Closure</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#242627', borderRadius: '8px' }}>

            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }}
              onClick={() => {
                const sOut = async () => {
                  const { error } = await supabase.auth.signOut();
                  console.log('sign out');
                  console.log(error);
                  localStorage.removeItem('signedIns');
                  localStorage.removeItem('signUids');
                  localStorage.removeItem('signNames');
                  localStorage.removeItem('signRef');
                  router.push('/login');
                }
                sOut();
              }
              }>
              <Stack direction='row' spacing={1} justifyContent='start' >
              <Icon icon="hugeicons:logout-05" width="24" height="24" style={{ color: '#a3a3a3' }} />
                <Typography sx={{ color: '#CACACA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Sign out</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
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
