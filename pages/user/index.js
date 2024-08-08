import React, { useContext, useEffect } from "react";
import { useRouter } from 'next/router'
import Head from "next/head";
import Cover from './cover'
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import Image from "next/image";
import Link from 'next/link'
import { Button, Typography, Paper, Divider } from "@mui/material";
import { supabase } from '../api/supabase'
import Agent from '../../public/afc1.jpg'
import Agent1 from '../../public/afc2.jpg'
import Agent2 from '../../public/afc3.jpg'
import { motion } from 'framer-motion'
import Agent3 from '../../public/afc3.jpg'
import Agent4 from '../../public/afc4.jpg'
import front from '../../public/front.png'
import fire from '../../public/Group 2.png'
import Ims from '../../public/simps/ball.png'
import { app } from '../api/firebase';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getAuth, signOut } from "firebase/auth";
import Backdrop from '@mui/material/Backdrop';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import { ImageAspectRatioTwoTone } from "@mui/icons-material";



export default function Home() {
  const [anchorEl, setAnchorEl] = useState(null);
  const openr = Boolean(anchorEl);
  const [drop, setDrop] = useState(false);
  const handleClickr = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloser = () => {
    setAnchorEl(null);
  };
  const [footDat, setFootDat] = useState([])
  const [balance, setBalance] = useState(0)
  const [info, setInfo] = useState({})
  const auth = getAuth(app);
  const [draw, setDraw] = useState(false);
  let loads = 0;
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      // ...
      console.log(name)
      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', name)
          setInfo(data[0]);
          setBalance(data[0].balance);
          console.log(data)
          console.log(error)
          localStorage.setItem('signRef', data[0].newrefer);
        } catch (e) {
          console.log(e)

        }

      }
      GET();

    } else {
      // User is signed out
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


    const getUsers = async () => {
      // const { data, error } = await supabase
      //   .from('bets')
      //   .select()
      //   .eq('verified', false)
      //   .limit(5)
      //   .order('id', { ascending: false });
      setFootDat([]);

    };
    getUsers()
  }, [balance]);

  const router = useRouter();

  function Carousel() {
    const images = {
      0: Agent,
      1: Agent1,
      2:Agent2
    };
    const [current, setCurrent] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrent((prevCurrent) => (prevCurrent === 0 ? 1 : prevCurrent === 1 ? 2 : 0));
      }, 8000);

      return () => clearInterval(interval);
    }, []);

    return (
      <Stack>
         <motion.div
        key={current}
        initial={{ opacity: 0, transition: { duration: 1, ease: 'easeIn' } }}
        animate={{ opacity: 1, }}
        exit={{ opacity: 0, transition: { duration: 2, ease: 'easeOut' } }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
          <Image src={images[current]} width={354} height={140} alt="bonus" style={{ width: 'auto', height: 'auto', borderRadius: '5px' }} />
      </motion.div>
       </Stack>
    );
  }

  return (
    <Stack justifyContent="start" alignItems="center"
      style={{ background: "#242627", marginBottom: "50px", minHeight: '95vh', }}
    >


      <Cover sx={{ background: '#242627', minWidth: '100%', height: '100vh' }}>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={drop}
        >
          <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
        </Backdrop>
        <Head>
          <title>Welcome - {info ? `${info.username}` : 'Loading...'}</title>
          <link rel="icon" href="/brentford.ico" />
        </Head>
        <Stack sx={{ background: "#242627", marginTop: '10px', minWidth: '350px', maxWidth: '450px' }} spacing={2} justifyContent='center' >

          <Stack direction="column" spacing={1} sx={{ background: '#373636', padding: '12px', borderRadius: '10px' }}>
            <Typography style={{ fontSize: '16px', fontWeight: '300', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', textAlign: 'left', color: '#E9E5DA' }}>Hello {info ? `${info.username}` : 'Loading...'},</Typography>
            <Stack direction='row' justifyContent='space-between' alignItems='center' >
              <Stack>
                <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#E9E5DA' }}>Current Balance </Typography>
                <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#E9E5DA' }}>{info ? ` ${balance.toFixed(3)}` : '0'} USDT</Typography>
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
          <Divider sx={{ background: '#E9E5DA' }} />

          <Carousel />

          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={1}>
              <Image src={fire} width={24} height={24} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '16px', fontWeight: '600' }}>Top Football Matches</Typography>
            </Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>see all</Typography>
          </Stack>
          <Stack direction='row' spacing={1}>
            <Stack sx={{ background: '#CACACA', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#000000', fontSize: '12px', fontWeight: '100' }}>This Week</Typography></Stack>
            <Stack sx={{ background: '#E94E55', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>Today</Typography></Stack>
            <Stack sx={{ background: '#CACACA', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#000000', fontSize: '12px', fontWeight: '100' }}>Next 3 hrs</Typography></Stack>
            <Stack sx={{ background: '#CACACA', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#000000', fontSize: '12px', fontWeight: '100' }}>Next 30 mins</Typography></Stack>
          </Stack>

          <Stack alignItems='center'>
            {
              footDat.map((pro) => {
                let stams = Date.parse(pro.date + " " + pro.time) / 1000;
                let curren = new Date().getTime() / 1000;
                const league = (pro.league === 'others') ? pro.otherl : pro.league;
                let date = parseInt(new Date(pro.date).getMonth() + 1);
                let day = new Date(pro.date).getDate();
                let time = pro.time.substring(0, pro.time.length - 3)
                return (

                  <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'
                    key={"match" + pro.home + pro.away}
                    style={{
                      marginBottom: "8px", padding: "18.5px",
                      display: (stams < curren) ? 'none' : 'visible',
                      background: '#EFEFEF',
                      width: '343px',
                      borderRadius: '5px',
                      height: '210px'
                    }} onClick={() => {
                      setDrop(true)
                      //register/000208
                      router.push("/user/match/" + pro.match_id)
                    }}>
                    <Stack direction='column'>
                      <Typography style={{ color: 'E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{league} </Typography>
                      <Divider sx={{ background: 'E9E5DA' }} />
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                      <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                        <Image src={pro.ihome ? pro.ihome : Ims} width={50} height={50} />
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'E9E5DA', fontSize: '12px', fontWeight: '100' }}>{pro.home}</Typography>
                      </Stack>
                      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'E9E5DA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                        <p>|</p>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'E9E5DA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                      </Stack>
                      <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                        <Image src={pro.iaway ? pro.iaway : Ims} width={50} height={50} />
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'E9E5DA', fontSize: '12px', fontWeight: '100' }}>{pro.away}</Typography>
                      </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                      <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#03045E' }}>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>1-0</Typography>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>{pro.onenil}</Typography>
                      </Stack>
                      <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#03045E' }}>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>1-1</Typography>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>{pro.oneone}</Typography>
                      </Stack>
                      <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#03045E' }}>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>1-2</Typography>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#F5E663' }}>{pro.onetwo}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                )
              })
            }
          </Stack>


          <Stack>

          </Stack>
        </Stack>
      </Cover>
    </Stack>
  )
}
