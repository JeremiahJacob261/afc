import Cover from './cover'
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from "react";
import Head from 'next/head'
import { Stack, Typography, Box, Paper, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../api/supabase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { app } from '../api/firebase';
import Loading from "@/pages/components/loading";
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import Image from 'next/image';
import Ims from '../../public/simps/ball.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
export default function Bets() {
  const auth = getAuth(app);
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [bets, setBets] = useState([])
  const [fina, setFina] = useState([])
  const [matchD, setMatchD] = useState({})
  const [display, setDisplay] = useState({})

  const handleClickOpen = () => {
    setOpen(true);
  };

  //the below controls the loading modal
  const [openx, setOpenx] = useState(false);
  const handleOpenx = () => setOpenx(true);
  const handleClosex = () => setOpenx(false);

  //the end of thellaoding modal control

  const handleClose = () => {
    setOpen(false);
  };
  const [value, setValue] = useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      // ...

      //settle the match


      //bb

      const Depositing = async (damount, dusername) => {
        const { data, error } = await supabase
          .rpc('depositor', { amount: damount, names: dusername })
        console.log(error);
      }

      const Chan = async (bets, type) => {
        const { data, error } = await supabase
          .rpc('chan', { bet: bets, des: type })
        console.log(error);
      }
      const GET = async () => {
        const { data, error } = await supabase
          .from('placed')
          .select()
          .match({ username: name, won: 'null' });
        setBets(data)

        //a for loop to get the match results
        data.map(async(d)=>{
          const { data: btx, error: bte } = await supabase
          .from('bets')
          .select('verified,results')
          .eq('match_id', d.match_id);
        if (btx[0]) {
          if(d.market != btx[0].results){
            Depositing(d.stake + d.aim, name);
            Chan(d.betid, 'true');
          }else{
            Chan(d.betid, 'false');
          }
        }
        });
      }
      GET();
      const GETn = async () => {
        const { data, error } = await supabase
          .from('placed')
          .select()
          .neq('won', 'null')
          .match({ username: name });

        setFina(data)
        console.log(data)
      }
      GETn();
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
    <Cover>

      <Loading open={openx} handleClose={handleClosex} />
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Bet History</Typography>
      </Stack>
      <Head>
        <title>BFC - My Bets </title>
        <meta name="description" content="View Your Recents Betslips" />
        <link rel="icon" href="/brentford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ color: "#03045E", minHeight: '90vh' }}>

        <Tabx />

      </div>
    </Cover>
  )
  function Tabx() {

    return (
      <TabContext value={value}>
        <Stack sx={{ borderBottom: 1, borderColor: 'divider' }} justifyContent='center'>
          <TabList onChange={handleChange} aria-label="lab API tabs example"
            textColor="white"
            indicatorColor="secondary"
            sx={{
              '.Mui-selected': {
                color: 'orange', // Customize the color here
              },
            }}
          >
            <Tab label="Active Bets" value="1" sx={{ color: '#CACACA', width: '50%' }} />
            <Tab label="Finished Bets" value="2" sx={{ color: '#CACACA', width: '50%' }} />
          </TabList>
        </Stack>
        <TabPanel value="1">
          <Stack spacing={2} direction='column-reverse'>

            {

              bets.map((s) => {
                console.log(s)
                let stams = Date.parse(s.date + " " + s.time) / 1000;
                let curren = new Date().getTime() / 1000;
                return (
                  <div key={s.betid} onClick={() => {
                    handleOpenx();
                    router.push('/user/viewbet/' + s.betid);
                  }}>
                    <Box sx={{ background: "#373636", padding: "12px", height: "max-content", width: '341px', height: 'auto', borderRadius: '10px' }} >

                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" marginBottom='20px' marginTop='20px'>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <Image src={Ims} width={20} height={20} alt='home' />
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '300', maxWidth: '91px', color: '#E6E8F3' }}>{s.home}</Typography>

                        </Stack>
                        <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '500', color: '#FFB400' }}>VS</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-around">
                          <Image src={Ims} width={20} height={20} alt='away' />
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '300', maxWidth: '91px', color: '#E6E8F3' }}>{s.away}</Typography>

                        </Stack>
                      </Stack>
                      <Stack direction='column' spacing={2}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Market</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.market}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Odds</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.odd} %</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Stake</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.stake} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Profit</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{parseFloat(s.stake + s.profit).toFixed(3)} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}> Status</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}> {(stams > curren) ? 'Not Started' : (s.won === 'null') ? 'Ongoing' : (s.won === 'true') ? 'Won' : 'Lost'}</Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </div>
                )
              })


            }
          </Stack>
        </TabPanel>
        {
          //tab 2
        }
        <TabPanel value="2">
          <Stack spacing={3} direction='column-reverse'>


            {

              fina.map((s) => {
                let stams = Date.parse(s.date + " " + s.time) / 1000;
                let curren = new Date().getTime() / 1000;
                return (
                  <div key={s.betid} onClick={() => {
                    handleOpenx();
                    router.push('/user/viewbet/' + s.betid);
                  }}>
                    <Box sx={{ background: "#373636", padding: "12px", height: "max-content", width: '341px', height: 'auto', borderRadius: '10px' }} >

                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" marginBottom='20px' marginTop='20px'>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <Image src={Ims} width={20} height={20} alt='home' />
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '300', maxWidth: '91px', color: '#E6E8F3' }}>{s.home}</Typography>

                        </Stack>
                        <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '500', color: '#FFB400' }}>VS</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-around">
                          <Image src={Ims} width={20} height={20} alt='away' />
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '300', maxWidth: '91px', color: '#E6E8F3' }}>{s.away}</Typography>

                        </Stack>
                      </Stack>
                      <Stack direction='column' spacing={2}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Market</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.market}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Odds</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.odd} %</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Stake</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{s.stake} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}>Profit</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}>{parseFloat(s.stake + s.profit).toFixed(3)} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '400', color: '#E6E8F3' }}> Status</Typography>
                          <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#FFFFFF' }}> {(stams > curren) ? 'Not Started' : (s.won === 'null') ? 'Ongoing' : (s.won === 'true') ? 'Won' : 'Lost'}</Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </div>
                )
              })


            }
          </Stack>
        </TabPanel>
      </TabContext>);
  }
}
