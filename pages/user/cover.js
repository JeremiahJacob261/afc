import BottomNavi from "./bottom_navi"
import { Stack, Typography, Button } from "@mui/material"
import Drawer from '@mui/material/Drawer';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from "firebase/auth";
import { BiTimer } from 'react-icons/bi'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import TranslateIcon from '@mui/icons-material/Translate';
import { BsFillPersonFill } from 'react-icons/bs'
import { BiSolidContact } from 'react-icons/bi'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import Image from 'next/image'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Icon } from '@iconify/react'
import { app } from '../api/firebase';
import { supabase } from '../api/supabase'
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getAuth, signOut } from "firebase/auth";
import Translate from '@/pages/translator';
import { useRouter } from "next/router";
export default function Cover({ children }) {



  const [draw, setDraw] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openr = Boolean(anchorEl);
  const [drop, setDrop] = useState(false);
  const auth = getAuth(app)
  const [info, setInfo] = useState({})
  const router = useRouter();
  const handleClickr = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloser = () => {
    setAnchorEl(null);
  };
  let loads = 0;
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      async function getData() {
        console.log('get Data got the message')
        try {
          const { data, error } = await supabase
            .from('notification')
            .select()
            .match({
              sent: 'success',
              type: 'deposit',
              username: name
            });
          console.log('data obtained')
          for (let i = 0; i < data.length; i++) {
            const element = data[i];
            const uploadData = async () => {


              const { data, error } = await supabase
                .rpc('gatherd', { names: element.username, amount: parseFloat(element.amount) })
              console.log(error)
            }
            uploadData(element)
          }


          async function Dcollect() {
            try {
              const { data, error } = await supabase
                .from('users')
                .update({ dcollect: true })
                .eq('username', name)
              console.log('dcollect done')
              console.log(data)
            } catch (e) {
              console.log(e);
            }

          }
          Dcollect();
        } catch (e) {
          console.log(e)
        }
      }
      async function GetInfo() {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('dcollect')
            .eq('username', name)
          let info = data[0].dcollect;
          if (!info) {
            // getData();
          } else {
            console.log('neve go tit')
          }
        } catch (e) {
          console.log(e);
        }
      }
      GetInfo();
      // ...
      console.log(loads)


    } else {
      // User is signed out
      // ...
      signOut(auth);
      console.log('sign out');
      localStorage.removeItem('signedIns');
      localStorage.removeItem('signUids');
      localStorage.removeItem('signNames');
      router.push('/login');
    }
  }, []);

  return (
    <Stack direction="column"
      justifyContent="center"
      alignItems="center" 
      style={{ width: '100%', background: "#242627",paddingTop:'#50px',marginTop:'-10px' }}>
      {
        //drawer layout
      }
      <React.Fragment >
        <Drawer
          anchor='left'
          open={draw}
          onClose={() => {
            setDraw(false)
          }}
        >
          <Stack direction='column' sx={{ padding: '12px', background: '#242627', height: '100%' }}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Link href="/" style={{ textDecoration: "none" }}>
                <p style={{ fontFamily: 'Noto Serif, serif', color: "#E9E5DA", fontWeight: '400', fontSize: '20px' }}>BFC  </p>
              </Link>

            </Stack>

            <Stack direction='column'>
              <Link href='/user/matches' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <SportsSoccerIcon sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Matches</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/bets' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BiTimer sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Bets</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack>
              </Link>

              <Link href='/user/fund' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <GiPayMoney sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Deposit</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/withdraw' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <GiReceiveMoney sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Withdraw</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/account' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BsFillPersonFill sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Profile</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='https://t.me/+WJKvJKagKuozNzM8' style={{ textDecoration: "none", color: '#CACACA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BiSolidContact sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Contact</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                <Stack direction='row' spacing={2}>
                  <TranslateIcon sx={{ width: '20px', height: '20px', color: '#D20000' }} />
                  <Typography className='notranslate' sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#CACACA' }}>Language</Typography>
                </Stack>
                <ArrowForwardIosIcon sx={{ width: '20px', height: '20px', color: '#D20000' }} />
              </Stack>
            </Stack>
            {/* the start of supported Languages */}
            <Translate />
          </Stack>
        </Drawer>
      </React.Fragment>
      {
        //drawer layout end
      }
      <Stack direction="row" style={{ background: '#242627', width: '100%', height: '64px', padding: '5px' }}
        alignItems='center' justifyContent="space-between">
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon icon="tabler:grid-dots" width="24" height="24" style={{ color: '#FFB400' }} onClick={() => {
            setDraw(true)
          }} />
        </div>
        <p className="text-white font-roboto">BFC </p>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon icon="solar:bell-bold" width="24" height="24" style={{ color: "#FFB400" }}
            onClick={() => {
              router.push('/user/notification');
            }} />
        </div> </Stack>
      <div style={{ paddingBottom: "50px" }}>  {children}</div>

      <BottomNavi />

    </Stack>

  )
}
