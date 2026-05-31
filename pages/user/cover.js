import BottomNavi from "./bottom_navi"
import { Stack, Typography, Divider } from "@mui/material"
import Drawer from '@mui/material/Drawer';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from "firebase/auth";
import { BiTimer } from 'react-icons/bi'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import { BsFillPersonFill } from 'react-icons/bs'
import { BiSolidContact } from 'react-icons/bi'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import Image from 'next/image'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Icon } from '@iconify/react'
import { app } from '@/pages/api/firebase';
import { supabase } from '@/pages/api/supabase'
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
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
    async function checkSession() {
      const session = await requireSession(router);
      if (session) {
        clearLegacyAuthStorage();
      }
    }

    checkSession();
  }, [router]);

  return (
    <Stack direction="column"
      style={{ width: '100%', minHeight: '100dvh', background: "#06101F", display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflowX: 'hidden', paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
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
          <Stack direction='column' sx={{ padding: '12px', background: '#06101F', height: '100%', position: 'fixed' }}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Link href="/" style={{ textDecoration: "none" }}>
                <p style={{ fontFamily: 'Noto Serif, serif', color: "#E9E5DA", fontWeight: '400', fontSize: '20px' }}>EFC  </p>
              </Link>
              <Icon icon="ri:close-fill" width="32" height="32" style={{ color: "#1BB6FF" }} onClick={() => {
                setDraw(false)
              }} />
            </Stack>

            <Stack direction='column' >
              <Link href='/user/matches' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <SportsSoccerIcon sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Matches</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/bets' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BiTimer sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Bets</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack>
              </Link>

              <Link href='/user/fund' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <GiPayMoney sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Deposit</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/withdraw' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <GiReceiveMoney sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Withdraw</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>

              <Link href='/user/account' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BsFillPersonFill sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Profile</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack>
              </Link>

              <Link href='https://t.me/EFC_Support' style={{ textDecoration: "none", color: '#E9E5DA', cursor: 'pointer' }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '224px', height: '41px' }}>
                  <Stack direction='row' spacing={2}>
                    <BiSolidContact sx={{ width: '20px', height: '20px' }} />
                    <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500', color: '#E9E5DA' }}>Customer Care</Typography>
                  </Stack>
                  <ArrowForwardIosIcon sx={{ width: '20px', height: '20px' }} />
                </Stack></Link>
            </Stack>
          </Stack>
        </Drawer>
      </React.Fragment>
      {
        //drawer layout end
      }
      <Stack direction="row" style={{
        background: '#06101F', width: '100%', height: '64px', padding: '12px', position: 'fixed', top: '0px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: '100'
      }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon icon="tabler:grid-dots" width="24" height="24" style={{ color: '#1BB6FF' }} onClick={() => {
            setDraw(true)
          }} />
        </div>
        <p className="font-roboto" style={{ color: '#23B5FF', fontWeight: '500' }}>EUROPEAN FOOTBALL</p>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon icon="solar:bell-bold" width="24" height="24" style={{ color: "#1BB6FF" }}
            onClick={() => {
              router.push('/user/notification');
            }} />
        </div> </Stack>
      <div style={{ width: '100%', maxWidth: '450px', padding: '70px 12px 0', boxSizing: 'border-box' }}>  {children}</div>
      <Divider sx={{ bgcolor: "#1BB6FF" }} />
      <BottomNavi />

    </Stack>

  )
}
