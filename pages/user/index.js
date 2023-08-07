import { useContext, useEffect } from "react";
import { useRouter } from 'next/router'
import Head from "next/head";
import Cover from './cover'
import { Box, Stack } from "@mui/system";
import { getCookies, getCookie, setCookies, removeCookies, setCookie } from 'cookies-next';
import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import Link from 'next/link'
import afc1 from '../../public/simps/AFC.jpg'
import afc2 from '../../public/simps/AFC2.jpg'
import afc3 from '../../public/simps/AFC3.jpg'
import iv from '../../public/simps/Invitation Bonus.jpg'
import kik from '../../public/simps/kick.png'
import sal from '../../public/simps/Monthly salary.png'
import ref from '../../public/simps/Referral Bonus.jpg'
import Logos from '../../public/logoclean.png'
import ads2 from '../../public/adse2.png'
import { Button, Typography, Paper, Container } from "@mui/material";
import { supabase } from '../api/supabase'
import Agent from '../../public/posters6.jpg'
import WhatshotIcon from '@mui/icons-material/Whatshot';
import NotificationsNoneSharpIcon from '@mui/icons-material/NotificationsNoneSharp';
import Ims from '../../public/simps/ball.png'
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
export default function Home() {
  const [footDat, setFootDat] = useState([])
  const [balance, setBalance] = useState(0)
  const [info, setInfo] = useState({})
  const auth = getAuth(app);

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

    const getUsers = async () => {
      const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('verified', false)
        .limit(5)
      setFootDat(data);
    };
    getUsers()
  }, [info, setFootDat]);

  const router = useRouter()
  return (
    <Stack justifyContent="center" alignItems="center"
      style={{ background: "#03045E", marginBottom: "50px" }}
    >
      <Stack direction="row" style={{ background: '#F5F5F5', width: '100%', height: '64px', padding: '5px' }}
        alignItems='center' justifyContent="space-between">
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Image src={Logos} width={30} height={46} alt='logo' />
        </div>
        <Typography style={{ fontSize: '24px', fontWeight: '800', color: '#181AA9', margin: '4px', fontFamily: 'Poppins, sans-serif' }}>AFCFIFA</Typography>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Link href='/user/account' style={{ textDecoration: 'none' }}>
          <NotificationsNoneSharpIcon sx={{color:'white'}}/>
     </Link>

        </div> </Stack>
      <Cover>  <Head>
        <title>Welcome -{info.username}</title>
        <link rel="icon" href="/logo_afc.ico" />
      </Head>
        <Stack sx={{ background: "#03045E", marginTop: '10px' }} spacing={4} justifyContent='center' alignItems='center'>
          <Typography style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Poppins, sans-serif', height: '99px', padding: '5px', width: '100%', textAlign: 'left', color: 'white' }}>Welcome, <br /> {info.username}</Typography>
          <Typography style={{ fontSize: '16px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: 'white' }}>Current Balance: {info.balance} USDT</Typography>
          <div style={{ background: '#1A1B72', padding: '8px', borderRadius: '5px' }}>
            <Image src={iv} width={331} height={157} alt='invitation bonus' />
            <Typography style={{ width: '308px', fontFamily: 'Poppins, sans-serif', color: 'white', fontWeight: 'bold', padding: '8px' }}>Unlimited Invitation Bonus</Typography>
            <Typography style={{ width: '308px', height: '74px', color: 'white', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
              On the Account Page, copy the invite link and share to your friends to earn Invitation Bonus
            </Typography>
            <Link href='/user/account'>
              <Button style={{ border: '1px solid #03045E', color: 'white', width: '100%' }}>Go To Account Page</Button></Link>
          </div>
          <Typography style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Poppins, sans-serif', height: '51px', padding: '5px', width: '100%', textAlign: 'left', color: 'white' }}>Top Matches</Typography>
          <Typography style={{ width: '308px', height: '30px', fontSize:'13px',color: 'white', fontFamily: 'Poppins, sans-serif', fontWeight: '200', padding: '2px', margin: '4px' }}>
          See some of our matches with the best odds
            </Typography>
          {
          footDat.map((pro) => {
            let stams = Date.parse(pro.date + " " + pro.time) / 1000;
            let curren = new Date().getTime() / 1000;
            const league = (pro.league === 'others') ? pro.otherl : pro.league ;
            return (
              
                <Stack direction="column" alignItems="center"
                key={"match" + pro.home + pro.away}
                style={{
                  marginBottom: "8px", padding: "4px",
                  display:(stams<curren) ? 'none':'visible',
                  background:'#1A1B72',
                  width:'100%',
                  borderRadius:'5px'
                }} onClick={() => {
                  setDrop(true)
                  //register/40985
                  router.push("/user/match/" + pro.match_id)
                }}>
                <Typography style={{color:'#DFA100',fontFamily: 'Poppins, sans-serif',fontSize:'12px'}}>{pro.date} </Typography>
                 
                  <Stack direction="row" spacing={4}>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="home" width='53' height='53' />
                      <Typography style={{color:'white',fontFamily: 'Poppins, sans-serif',fontSize:'13px',height:'44px',padding:'4px',width:'104px',textAlign:'center'}}>{pro.home}</Typography>
                    </Stack>
                    <Stack spacing={2} alignItems="center" justifyContent="center">
                      <Typography style={{color:'#181AA9',fontWeight:'800',fontSize:'24'}}>VS</Typography>
                      <Typography style={{color:'white',fontWeight:'bold',fontFamily: 'Poppins, sans-serif',fontSize:'12px'}}>{pro.time} </Typography>
                    </Stack>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="away" width='53' height='53' />
                      <Typography style={{color:'white',fontFamily: 'Poppins, sans-serif',fontSize:'13px',height:'44px',padding:'4px',width:'104px',textAlign:'center'}}>{pro.away}</Typography>
                    </Stack>
                  </Stack>
                  <Typography style={{ textAlign:'center',color:'#9D9EF1',fontSize:'13px',width:'100%' }}>{league}</Typography>
                </Stack>
            )
          })
        }
        <Button style={{background:'#181AA9',color:'white',borderRadius:'5px',width:'100%',height:'57px'}}>
          See More Matches
        </Button>
        <Stack>
          
        </Stack>
        </Stack>
      </Cover>
    </Stack>
  )
}
