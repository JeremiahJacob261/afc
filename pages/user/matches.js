import Cover from './cover'
import { supabase } from '../api/supabase'
import { useContext, useEffect, useState } from "react";
import { Paper, Stack, Typography, Button ,Divider} from '@mui/material'
import Image from "next/image";
import Head from 'next/head'
import Ims from '../../public/simps/ball.png'
import { useRouter } from "next/router";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
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
        maxWidth: "350px", background: "#E5E7EB",minHeight:'100vh'
      }}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{padding:'5px',margin:'2px'}}>
        <KeyboardArrowLeftOutlinedIcon sx={{width:'24px',height:'24px'}} onClick={()=>{
          router.push('/user')
        }}/>
        <Typography sx={{fontSize:'16px',fontFamily:'Poppins,sans-serif',fontWeight:'300'}}>Matches</Typography>
        </Stack>
        <Stack alignItems='center'>
            {
            footDat.map((pro) => {
              let stams = Date.parse(pro.date + " " + pro.time) / 1000;
              let curren = new Date().getTime() / 1000;
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
                    <Image src={pro.ihome ? pro.ihome : Ims} width={65} height={50} alt='home'/>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{pro.home}</Typography>
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                   <p>|</p>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                  </Stack>
                  <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={pro.iaway ? pro.iaway : Ims} width={65} height={50} alt='away'/>
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
          </div>
    </Cover>

  )
}
export async function getServerSideProps(context) {
  const { data, error } = await supabase
    .from('bets')
    .select()
    .eq('verified',false)
  let footDat = data;
  console.log(data)
  return {
    props: { footDat }, // will be passed to the page component as props
  }
}
