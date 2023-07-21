import Cover from './cover'
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from "react";
import Head from 'next/head'
import { Stack, Typography, Button, Paper } from '@mui/material';
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
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        console.log(user)
        const getMyBet = async () => {
          const { data, error } = await supabase
            .from('placed')
            .select()
            .eq('username', user.displayName)
          setBets(data)
          console.log(data.length)
        }

        getMyBet()
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });

  }, []);
  return (
    <Cover>
      <Head>
        <title>AFC - My Bets </title>
        <meta name="description" content="View Your Recents Betslips" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ color: "#03045E", height: '100vh' }}>

        <Typography variant="h4" sx={{ color: "#E8E5DA", margin: "8px", fontFamily: "'Barlow', sans-serif" }}>Bets</Typography>

        <Stack direction="column"
          spacing={2} style={{ maxWidth: "350px", background: 'none' }}>
          {function () {

            bets.map((s) => {
              return (
                <div key={s.betid} onClick={() => {
                  router.push('/user/viewbet/' + s.betid);
                }}>
                  <Paper sx={{ background: "#0B1723", padding: "4px", height: "max-content" }} >
                    <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-around">
                      <Stack style={{ padding: "8px", width: "350px", height: "80px" }} direction="column" >

                        <Typography sx={{ color: "white", fontSize: '15px' }}>{s.home} vs {s.away}</Typography>
                        <Typography variant="subbtitle2" sx={{ color: "white", fontSize: '15px' }}> {s.market}</Typography>
                      </Stack>
                      <Typography sx={{
                        fontFamily: 'Changa, sans-serif', fontSize: '15px', color: "white"
                      }}>{s.stake} USDT</Typography>
                      <Typography style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Time : {s.time}</Typography>
                      <Typography style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Date : {s.date} </Typography>
                    </Stack>
                  </Paper>
                </div>
              )
            })
          }

          }
        </Stack>
      </div>
    </Cover>
  )
}