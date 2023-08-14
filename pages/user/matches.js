import Cover from './cover'
import { supabase } from '../api/supabase'
import { useContext, useEffect, useState } from "react";
import { Paper, Stack, Typography, Button } from '@mui/material'
import Image from "next/image";
import Head from 'next/head'
import Ims from '../../public/simps/ball.png'
import { useRouter } from "next/router";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
export default function Matches({ footDat }) {
  const [drop,setDrop] = useState(false)
  const [info, setInfo] = useState({})
  
  const router = useRouter()
  
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
        maxWidth: "350px", background: "#03045E",minHeight:'100vh'
      }}>
        <Typography variant="h4" sx={{ color: "#E8E5DA", margin: "8px", fontFamily: "'Barlow', sans-serif" }}>List Of Our Favourite Matches</Typography>
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
                  //register/000208
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