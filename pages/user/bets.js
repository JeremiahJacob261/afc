import Cover from './cover'
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from "react";
import Head from 'next/head'
import { AppContext, BetContext, SlipContext } from "../api/Context";
import { Stack, Typography, Button, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../api/supabase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function Bets() {
  const [open, setOpen] = useState(false)
  const { slip, setSlip } = useContext(SlipContext);
  const router = useRouter()
  const [bets, setBets] = useState([])
  const { info, setInfo } = useContext(AppContext);
  const [matchD, setMatchD] = useState({})
  const [display, setDisplay] = useState({})
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {

    const getMyBet = async () => {
      const { data, error } = await supabase
        .from('placed')
        .select()
        .eq('username', localStorage.getItem('me'))
      setBets(data)
    }
    const getNoOfBets = async () => {
      const { count, error } = await supabase
        .from('placed')
        .select('*', { count: 'exact', head: true })
        .eq('username', localStorage.getItem('me'))
      setSlip(count)
    }
    getMyBet()
    getNoOfBets()
  }, [info]);
  return (
    <Cover>
      <Head>
        <title>AFC - My Bets </title>
        <meta name="description" content="View Your Recents Betslips" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ color: "#F9F9F9" }}>
        <Dialog open={open} onClose={handleClose} style={{ minWidth: "300px", padding: "8px" }}>
          <DialogTitle sx={{ color: "#1B5299", fontFamily: 'Caveat, cursive', fontSize: "25px" }}>DELETE Bet</DialogTitle>
          <DialogContent>
            <DialogContentText>Match Id :{display.match}</DialogContentText>
            <Stack direction="column" spacing={3}>
              <Typography>{display.home} VS {display.away}</Typography>
              <Typography>{display.market}</Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Exit</Button>
            <Button onClick={() => {
              const del = async () => {
                const { error } = await supabase
                  .from('placed')
                  .delete()
                  .eq('betid', display.id)
              }
              del();
              handleClose()

            }}>Delete Bet</Button>
          </DialogActions>
        </Dialog>
        <Stack direction="column"
          spacing={2} style={{ maxWidth: "350px" }}>
          {
            bets.map((s) => {
              return (
                <div key={s.betid}>
                  <Paper sx={{ background: "#0B1723", padding: "4px", height: "max-content" }} >
                    <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-around">
                      <Stack style={{ padding: "8px", width: "350px", height: "80px" }} direction="column" >

                        <Typography sx={{ color: "white" }}>{s.home} vs {s.away}</Typography>
                        <Typography variant="subbtitle2" sx={{ color: "white", fontSize: "18px" }}> {s.market}</Typography>
                        <Typography sx={{
                          fontFamily: 'Changa, sans-serif', fontSize: "18px", color: "white"
                        }}>{s.stake} USDT</Typography></Stack>
                      <CloseIcon sx={{ color: "white" }} onClick={() => {
                        setDisplay({
                          'match': s.match_id,
                          'home': s.home,
                          'away': s.away,
                          'market': s.market,
                          'id': s.betid
                        })
                        setOpen(true)

                      }} />
                    </Stack>
                  </Paper>
                </div>
              )
            })
          }
        </Stack>
      </div>
    </Cover>
  )
}