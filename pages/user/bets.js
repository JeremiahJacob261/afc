import Cover from './cover'
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from "react";
import Head from 'next/head'
import { Stack, Typography, Box, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../api/supabase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";

export default function Bets() {
  const auth = getAuth(app);
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [bets, setBets] = useState([])
  const [matchD, setMatchD] = useState({})
  const [display, setDisplay] = useState({})
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const useri = localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      // ...
      const GET = async () => {
        const { data, error } = await supabase
          .from('placed')
          .select()
          .eq('username', name)
        setBets(data)
      }
      GET();
    } else {
      // User is signed out
      // ...
      signOut(auth);
      console.log('sign out');
      localStorage.removeItem('signedIn');
      localStorage.removeItem('signUid');
      localStorage.removeItem('signName');
      router.push('/login');
    }


  }, []);
  return (
    <Cover>
      <Head>
        <title>AFC - My Bets </title>
        <meta name="description" content="View Your Recents Betslips" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ color: "#03045E", minHeight: '90vh' }}>

        <Typography variant="h4" sx={{ color: "#E8E5DA", margin: "8px", fontFamily: "'Barlow', sans-serif" }}>Bets</Typography>

        <Stack direction="column"
          spacing={2} style={{ maxWidth: "350px", background: 'none' }}>
          <Typography variant="h6" sx={{ color: "#EE8F00", margin: "8px", fontFamily: "'Barlow', sans-serif" }}>Active</Typography>

          {

            bets.map((s) => {
              return (
                <div key={s.betid} onClick={() => {
                  router.push('/user/viewbet/' + s.betid);
                }}>
                  <Box sx={{ background: "#1A1B72", padding: "4px", height: "max-content" }} >
                    <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-around">
                      <Stack style={{ padding: "8px", width: "350px", height: "80px" }} direction="column" justifyContent='space-between' >
                        <Typography sx={{ color: "white",padding: "6px", fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', width: '175px' }}>{s.home}</Typography>
                        <Typography sx={{ color: "white", padding: "6px",fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', width: '175px' }}>{s.away}</Typography>
                      </Stack>
                      <Stack direction='column'>
                        <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', color: "#C7C5C0" }}>{s.stake} USDT</Typography>
                        <Typography variant="subtitle2" sx={{ color: "#EE8F00", fontSize: '15px' }}> {s.market}</Typography>
                        <Typography style={{ color: '#2426F8', fontFamily: 'Poppins, sans-serif', fontSize: '12px', width: '151px', fontWeight: '200' }}>{s.time} {s.date}</Typography>

                      </Stack>
                    </Stack>
                  </Box>
                </div>
              )
            })


          }

        </Stack>
      </div>
    </Cover>
  )
}