import Cover from './cover'
import { supabase } from '../api/supabase'
import { useContext, useEffect, useState } from "react";
import { Paper, Stack, Typography, Button, Divider } from '@mui/material'
import Image from "next/image";
import Head from 'next/head'
import Ims from '../../public/simps/ball.png'
import { Icon } from '@iconify/react';
import { useRouter } from "next/router";
import Backdrop from '@mui/material/Backdrop';
import Loading from "../components/loading";
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';


export default function Matches({ footDat }) {
  const [drop, setDrop] = useState(false)
  const [info, setInfo] = useState({})
  console.log(footDat)
  const router = useRouter()
  //the below controls the loading modal
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  //the end of thellaoding modal control


  return (
    <Cover>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Loading open={open} handleClose={handleClose} />
      <Head>
        <title>BFC - Matches</title>
        <meta name="description" content="See the Best Matches Provided By BFC- " />
        <link rel="icon" href="/brentford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{
        minWidth: '370px', maxWidth: "450px", background: "#242627", minHeight: '90vh'
      }}>
        <Stack >
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
            router.push('/user')
          }} />
          <Typography sx={{ fontSize: '16px', color: 'white', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Matches</Typography>

        </Stack>
        <Stack alignItems='center' direction={"column-reverse"}>
          {
            footDat.map((pro) => {
              // let stams = Date.parse(pro.date + " " + pro.time) / 1000;
              let stams = pro.tsgmt / 1000;
              let d1 = new Date();
              d1.toUTCString();
              // two hours less than my local time
              let d1utc = Math.floor(d1.getTime() / 1000);
              // let curren = new Date().getTime() / 1000;
              let curren = d1utc;
              // let curren = new Date().getTime() / 1000;
              const league = (pro.league === 'others') ? pro.otherl : pro.league;
              let date = parseInt(new Date(pro.date).getMonth() + 1);
              let day = new Date(pro.date).getDate();
              let time = pro.time.substring(0, pro.time.length - 3)
              return (

                <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'
                  key={pro.match_id}
                  style={{
                    marginBottom: "8px", padding: "18.5px",
                    display: (stams < curren) ? 'none' : 'visible',
                    background: '#373636',
                    width: '343px',
                    borderRadius: '5px',
                    minHeight: '210px'
                  }} onClick={() => {
                    handleOpen()
                    //register/000208
                    router.push("/user/match/" + pro.match_id)
                  }}>
                  <Stack direction='column'>
                    <Stack direction="rows" alignItems="center" justifyContent="center">
                      {
                        (pro.company) ?
                          <>
                            <Icon icon="solar:star-bold-duotone" width="24" height="24" style={{ color: '#FFB400' }} />
                            <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Verified Company Game</Typography>
                          </>
                          : <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}></Typography>
                      }
                    </Stack>
                    <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{league} </Typography>
                    <Divider sx={{ background: '#FFB400' }} />
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                    <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                      <Image src={pro.ihome ? pro.ihome : Ims} width={50} height={50} alt='home' />
                      <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{pro.home}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                      <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                      <p>|</p>
                      <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                    </Stack>
                    <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                      <Image src={pro.iaway ? pro.iaway : Ims} width={50} height={50} alt='away' />
                      <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{pro.away}</Typography>
                    </Stack>
                  </Stack>
                  <Stack direction='row' spacing={2} >
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3', border: pro.company ? '3px solid #FFB400' : '3px solid #E94E55' }}>
                      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>1-0</Typography>
                      <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>{pro.onenil}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3', border: pro.company ? '3px solid #FFB400' : '3px solid #E94E55' }}>
                      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>1-1</Typography>
                      <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>{pro.oneone}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3', border: pro.company ? '3px solid #FFB400' : '3px solid #E94E55' }}>
                      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>1-2</Typography>
                      <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#808080' }}>{pro.onetwo}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              )
            })
          }


        </Stack>
      </div>
    </Cover>

  )
}
export async function getServerSideProps(context) {
  console.log('hello')
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('verified', false)
    .limit(50)
    .order('id', { ascending: false });
  let footDat = data;
  console.log(data)
  console.log(error)
  return {
    props: { footDat }, // will be passed to the page component as props
  }
}
