import { useContext, useEffect } from "react";
import { useRouter } from 'next/router'
import Head from "next/head";
import Cover from './cover'
import { Box, Stack } from "@mui/system";
import { getCookies, getCookie, setCookies, removeCookies, setCookie } from 'cookies-next';
import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import ads1 from '../../public/logo_afc.ico'
import ads2 from '../../public/adse2.png'
import { Button, Typography, Paper, Container } from "@mui/material";
import { supabase } from '../api/supabase'
import Ims from '../../public/ball.png'
import Agent from '../../public/posters6.jpg'
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
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
          console.log(data)
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
        .eq('verified',false)
        .limit(5)
      setFootDat(data);
    };
    getUsers()
  }, [info,setFootDat]);

  const router = useRouter()
  return (
    <Stack justifyContent="center" alignItems="center"
      style={{ background: "#03045E", marginBottom: "50px", padding: "8px" }}
    >
      <Stack sx={{ width: "100%" }} justifyContent="center" alignItems="center" >
        <Paper elevation={5} style={{ position: "fixed", top: 0, margin: "4px", padding: "8px" }}>Your Balance is {balance} USDT</Paper>
      </Stack>
      <Cover>  <Head>
        <title>Welcome -{info.username}</title>
        <link rel="icon" href="/logo_afc.ico" />
      </Head>
        <Box sx={{ background: "#03045E" }}>
          <Image src={ads2} width='350' height='200' alt="firstimg" />

          <Stack direction="column" spacing={2} sx={{ background: "#03045E" }}>
            <Stack direction="row" alignItems="center"> <WhatshotIcon sx={{color:"whitesmoke",width:"30px",height:"30px"}}/>
            <Typography variant="h5" sx={{ marginLeft: "10px", marginTop: "10px", fontFamily: 'Poppins, sans-serif', color: "white", }}>Hot Matches</Typography>
            </Stack>
         <Typography variant="caption" sx={{ marginLeft: "25px", color: "white", }}> View the latest events and matches happening in Real-Time</Typography>
            <Paper elevation={5} sx={{ background: "#03045E", marginTop: "10px" }}>
            {
          footDat.map((pro) => {
            let stams = Date.parse(pro.date + " " + pro.time) / 1000;
            let curren = new Date().getTime() / 1000;
            const league = (pro.league === 'others') ? pro.otherl : pro.league ;
            return (
              <Paper key={"match" + pro.home + pro.away}
                style={{
                  marginBottom: "8px", padding: "4px",
                  display:(stams<curren) ? 'none':'visible'
                }} onClick={() => {
                  router.push("/user/match/" + pro.match_id)
                }}>
                <Stack direction="column" alignItems="center">
                  <h6 style={{ marginLeft: "8px" }}>{league}</h6>
                  <Stack direction="row" spacing={4}>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="home" width='35' height='35' />
                      <Typography>{pro.home}</Typography>
                    </Stack>
                    <Stack spacing={2} alignItems="center" justifyContent="center">
                      <Typography>VS</Typography>
                      <Typography>{pro.time}</Typography>
                    </Stack>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="away" width='35' height='35' />
                      <Typography>{pro.away}</Typography>
                    </Stack>
                  </Stack>
                </Stack>


              </Paper>
            )
          })
        }</Paper>
          </Stack>
          <Paper sx={{ background: "none", marginTop: "8px",padding:"4px" }}>
            <Typography variant="h5" sx={{ color: "whitesmoke", padding: "4px" }}>Become AN Agent</Typography>
            <Stack direction="column">
              <Image src={Agent} width='360' height='200' alt="agent"/>
              <Typography variant="h3" sx={{ fontFamily: 'Roboto Condensed, sans-serif', color: "white" }}>
                Agent Monthly Salary</Typography>
              <Stack direction="column">
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif' , color: "white"}}>
                  Invite 30 people - Earn A Monthly salary of 120 USDT
                </Typography>
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif', color: "white" }}>  Invite 30 people - Earn A Monthly salary of 120 USDT      </Typography>
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif', color: "white" }}> Invite 50 people - Earn A Monthly salary of 250 USDT    </Typography>
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif', color: "white" }}>  Invite 100 people - Earn A Monthly salary of 600 USDT  </Typography>
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif', color: "white" }}>Invite 300 people - Earn A Monthly salary of 1800 USDT   </Typography>
                <Typography sx={{ width: "100%", fontFamily: 'Nanum Gothic, sans-serif', color: "white" }}>Invite 500 people - Earn A Monthly salary of 3500 USDT  </Typography>
                <Typography sx={{ color: "white",fontFamily: 'Quicksand, sans-serif'}}>For the deposit the reward is 10% of the deposited Amount</Typography>
              </Stack>
              </Stack>
          </Paper>
        </Box>
      </Cover>
    </Stack>
  )
}
