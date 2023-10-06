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
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import iLink from '../../public/icon/ant-design_link-outlined.png'
import DiamondIcon from '@mui/icons-material/Diamond';
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
    const useri = localStorage.getItem('signedIn');
    setUsern(localStorage.getItem('signName'));
    setUserR(localStorage.getItem('signRef'));
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      console.log('...')
      // ...

      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', localStorage.getItem('signName'))
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
              'refer':localStorage.getItem('signRef'),
              'firstd':true
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
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
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
    <Cover style={{ width: "100%" }}>
      <Sncks />
      <Head>
        <title>{info ? `${info.username}` : 'Loading...'}&lsquo; Account</title>
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ padding: "8px", background: "#E5E7EB", width: '100%', minHeight: '80vh' }}>
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
          <Stack direction='row' spacing={2}>
            <Avatar>{info ? `${info.username}` : usern}</Avatar>
            <Stack direction='column'>
              <Typography sx={{ color: "black", fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins, sans-serif' }}>Hello {info ? `${info.username}` : usern}</Typography>
              <Typography sx={{ background:'#03045E', color: "#F5E663", fontSize: '14px', fontWeight: '300', fontFamily: 'Poppins, sans-serif',padding:'5px',width:'50px',borderRadius:'15px',textAlign:'center' }}>VIP {viplevel}</Typography>
            </Stack>
          </Stack>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ background: '#F5E663', padding: '8px', borderRadius: '10px' }}>
            <Stack>
              <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>Current Balance </Typography>
              <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>{balance.toFixed(3)} USDT</Typography>
            </Stack>
            <Link href='/user/fund' style={{ textDecoration: "none", color: 'white' }}>
              <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#0A369D', borderRadius: '20px', padding: '8px', width: '95px', height: '32px' }}>
                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white', fontSize: '12px' }}>
                  Deposit
                </Typography>
                <KeyboardArrowRightIcon sx={{ width: '16px', height: '16px' }} />
              </Stack>
            </Link>
          </Stack>
          {
            //deposit
          }
          <Stack direction='column'>
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Referral</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }}>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={iLink} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>https://afcfifa.netlify.app/register/{info ? info.newrefer : userR}</Typography>
              </Stack>
              <Image src={iCopy} width={20} height={20} alt='icopy'
                sx={{ background: '#47A8BD', padding: '5px', borderRadius: '5px' }}
                onClick={() => {
                  navigator.clipboard.writeText("https://afcfifa.netlify.app/register/" + info.newrefer)
                  setMessages("Invite Link Copied")
                  setOpened(true);
                }} />
            </Stack>

            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }}
              onClick={() => {
                router.push('/user/refferal');
              }}>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={iNT} width={24} height={24} alt='int' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>All Referral</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
          </Stack>
          {
            //end of deposit
          }
          {
            //fun
          }
          <Stack direction='column'>
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Deposit</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/fund');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start' >
                <Image src={St} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Fund Account</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/vip');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start' >
                <DiamondIcon sx={{color:'red'}}/>
                <Typography sx={{ color: 'black', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>VIP Progress</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //withdraw
          }
          <Stack direction='column'>
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Withdrawal</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/withdraw');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={Sw} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Withdraw</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>

            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/transaction');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={Vec} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>History</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>

            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/codesetting');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={Lk} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Code Setting</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
          </Stack>
          {
            //end of withdraw
          }
          {
            //fun
          }
          <Stack direction='column'>
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Bets</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
              router.push('/user/bets');
            }}>
              <Stack direction='row' spacing={1} justifyContent='start' >
                <Image src={Bt} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>My Bets</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //About
          }
          <Stack direction='column'>
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>About</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} onClick={() => {
              router.push("/user/faq")
            }
            }>
              <Stack direction='row' spacing={1} justifyContent='start'>
                <Image src={Fq} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>FAQ</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
            </Stack>

            < Link href='https://t.me/+WJKvJKagKuozNzM8'>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Image src={Tel} width={24} height={24} alt='ilink' />
                  <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Telegram</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Link>
            < Link href='https://t.me/Afcfifa_customercare'>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Image src={Tel} width={24} height={24} alt='ilink' />
                  <Typography sx={{ color: 'black', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Contact</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
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
            <Typography sx={{ color: "black", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>Closure</Typography>
            <Divider />
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }}
              onClick={() => {
                const sOut = async () => {
                  const { error } = await supabase.auth.signOut();
                  console.log('sign out');
                  console.log(error);
                  localStorage.removeItem('signedIn');
                  localStorage.removeItem('signUid');
                  localStorage.removeItem('signName');
                  localStorage.removeItem('signRef');
                  router.push('/login');
                }
                sOut();
              }
              }>
              <Stack direction='row' spacing={1} justifyContent='start' >
                <Image src={Ot} width={24} height={24} alt='ilink' />
                <Typography sx={{ color: 'black', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Sign out</Typography>
              </Stack>
              <KeyboardArrowRightIcon width={24} height={24} />
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
