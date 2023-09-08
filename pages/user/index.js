import  React,{ useContext, useEffect } from "react";
import { useRouter } from 'next/router'
import Head from "next/head";
import Cover from './cover'
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import Image from "next/image";
import Link from 'next/link'
import { Button, Typography, Paper, Divider } from "@mui/material";
import { supabase } from '../api/supabase'
import Agent from '../../public/posters6.jpg'
import front from '../../public/front.png'
import fire from '../../public/Group 2.png'
import WhatshotIcon from '@mui/icons-material/Whatshot';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Ims from '../../public/simps/ball.png'
import { app } from '../api/firebase';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import Backdrop from '@mui/material/Backdrop';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
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
  const [draw,setDraw] = useState(false);
    let loads = 0;
  useEffect(() => {
    const useri = localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // ...
      console.log(loads)
      
        const GET = async () => {
          try{
const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', localStorage.getItem('signName'))
          setInfo(data[0]);
          setBalance(data[0].balance);
          
          localStorage.setItem('signRef', data[0].newrefer);
          }catch(e){
            console.log(e)
            alert('Please Check your Internet Connection and Refresh the Website')
          }
          
        }
        GET();
      
    } else {
      // User is signed out
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


    const getUsers = async () => {
      const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('verified', false)
        .limit(5)
        .order('id', { ascending: false });
      setFootDat(data);
    };
    getUsers()
  }, [balance]);

  const router = useRouter()
  return (
    <Stack justifyContent="center" alignItems="center"
      style={{ background: "#E5E7EB", marginBottom: "50px" }}
    >
      
      
      <Cover sx={{background:'#E5E7EB',width:'100vh',height:'100vh'}}>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={drop}
        >
          <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
        </Backdrop>
        <Head>
          <title>Welcome - {info ? `${info.username}` : 'Loading...'}</title>
          <link rel="icon" href="/logo_afc.ico" />
        </Head>
        <Stack sx={{ background: "#E5E7EB", marginTop: '10px' }} spacing={4} justifyContent='center' >
          <Typography style={{ fontSize: '16px', fontWeight: '300', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '5px', width: '100%', textAlign: 'left', color: 'black' }}>Hello {info.username}</Typography>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Stack>
              <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>Current Balance </Typography>
              <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'black' }}>{info ? `${Number(info.balance).toFixed(2)}` : '0'} USDT</Typography>
            </Stack>
            <Link href='/user/fund' sx={{textDecoration:'none',color:'black'}}>
            <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#DDDDDD', borderRadius: '20px', padding: '8px', width: '95px',height:'32px' }}>
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'black', fontSize: '12px' }}>
                Deposit
              </Typography>
              <KeyboardArrowRightIcon sx={{width:'16px',height:'16px'}}/>
            </Stack>
            </Link>
          </Stack>
          <Divider sx={{ background: 'black' }} />
          <Stack justifyContent='center' alignItems='center'>
            <Image src={front} width={344} height={137} alt='invitation bonus' />
          </Stack>
          
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={1}>
              <Image src={fire} width={24} height={24} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '16px', fontWeight: '600' }}>Top Football Matches</Typography>
            </Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>see all</Typography>
          </Stack>
          <Stack direction='row' spacing={1}>
            <Stack sx={{ background: '#E6E8F3', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>This Week</Typography></Stack>
            <Stack sx={{ background: '#03045E', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E5E7EB', fontSize: '12px', fontWeight: '100' }}>Today</Typography></Stack>
            <Stack sx={{ background: '#E6E8F3', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>Next 3 hrs</Typography></Stack>
            <Stack sx={{ background: '#E6E8F3', padding: '10px', borderRadius: '20px' }}><Typography sx={{ fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>Next 30 mins</Typography></Stack>
          </Stack>
          <Stack alignItems='center'>
            {
            footDat.map((pro) => {
              let stams = Date.parse(pro.date + " " + pro.time) / 1000;
              let curren = new Date().getTime() / 1000;
              const league = (pro.league === 'others') ? pro.otherl : pro.league;
              console.log(new Date(pro.date))
              console.log(new Date(pro.time))
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
                    <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{league} </Typography>
                    <Divider sx={{ background: 'black' }} />
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                  <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={Ims} width={50} height={50}/>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{pro.home}</Typography>
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                   <p>|</p>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                  </Stack>
                  <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={Ims} width={50} height={50}/>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{pro.away}</Typography>
                  </Stack>
                  </Stack>
                  <Stack direction='row' spacing={2} >
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{borderRadius:'5px',width:'96px',height:'40px',background:'#E6E8F3'}}>
                      <Typography sx={{fontSize:'12px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>1-0</Typography>
                      <Typography sx={{fontSize:'16px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>{pro.onenil}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{borderRadius:'5px',width:'96px',height:'40px',background:'#E6E8F3'}}>
                      <Typography sx={{fontSize:'12px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>1-1</Typography>
                      <Typography sx={{fontSize:'16px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>{pro.oneone}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{borderRadius:'5px',width:'96px',height:'40px',background:'#E6E8F3'}}>
                      <Typography sx={{fontSize:'12px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>1-2</Typography>
                      <Typography sx={{fontSize:'16px',fontFamily:'Poppins,sans-serif',fontWeight:'400',color:'black'}}>{pro.onetwo}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              )
            })
          }
          </Stack>
          
          <Button style={{ background: '#181AA9', color: '#E5E7EB', borderRadius: '5px', width: '100%', height: '57px' }}
            onClick={() => {
              router.push('/user/matches')
            }}
          >
            See More Matches
          </Button>
          <Stack>

          </Stack>
        </Stack>
      </Cover>
    </Stack>
  )
}
