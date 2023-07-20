import Cover from './cover'
import { supabase } from '../api/supabase'
import { useContext, useEffect, useState } from "react";
import { Paper, Stack, Typography, Button } from '@mui/material'
import Image from "next/image";
import Head from 'next/head'
import { BetContext, SlipContext } from "../api/Context";
import Ims from '../../public/ball.png'
import { useRouter } from "next/router";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
export default function Matches({ footDat }) {
  const [drop,setDrop] = useState(false)
  const { bets, setBets } = useContext(BetContext);
  const { slip, setSlip } = useContext(SlipContext)
  const [info, setInfo] = useState({})
  
  const router = useRouter()
  const betting = (match, market, home, away, time, odds) => {
    setBets(bets.concat({
      "match_id": match,
      "market": market,
      "home": home,
      "away": away,
      "time": time,
      "odds": odds
    }))
    setSlip(slip + 1);
  }
  /*
   background: "rgba(255, 255, 255, 0.56)",
borderRadius: "16px",
boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
backdropFilter: "blur(9.2px)",
WebkitBackdropFilter: "blur(9.2px)",
border: "1px solid rgba(255, 255, 255, 0.3)"
  */
 
 
  return (
    <Cover>
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Head>
        <title>AFC - Matches</title>
        <meta name="description" content="See the Best Matches Provided By AFC-FiFa" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{
        maxWidth: "350px", background: "#4054A0"
      }}>
        <Typography variant="h4" sx={{ color: "#E8E5DA", margin: "8px", fontFamily: "'Barlow', sans-serif" }}>List Of Our Favourite Matches</Typography>
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
                  setDrop(true)
                  //register/40985
                  router.push("/user/match/" + pro.match_id)
                }}>
                <Stack direction="column" alignItems="center">
                <Typography style={{color:'black',fontFamily: 'Poppins, sans-serif',fontSize:'12px'}}>{pro.date} </Typography>
                 
                  <h6 style={{ marginLeft: "8px" }}>{league}</h6>
                  <Stack direction="row" spacing={4}>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="home" width='35' height='35' />
                      <Typography>{pro.home}</Typography>
                    </Stack>
                    <Stack spacing={2} alignItems="center" justifyContent="center">
                      <Typography>VS</Typography>
                      <Typography style={{color:'black',fontFamily: 'Poppins, sans-serif',fontSize:'12px'}}>{pro.time} </Typography>
                    </Stack>
                    <Stack alignItems="center">
                      <Image src={Ims} alt="away" width='35' height='35' />
                      <Typography style={{color:'black',fontFamily: 'Poppins, sans-serif',fontSize:'15px'}}>{pro.away}</Typography>
                    </Stack>
                  </Stack>
                </Stack>


              </Paper>
            )
          })
        }</div>
    </Cover>

  )
}
export async function getServerSideProps(context) {
  const { data, error } = await supabase
    .from('bets')
    .select()
    .eq('verified',false)
  let footDat = data;
  return {
    props: { footDat }, // will be passed to the page component as props
  }
}