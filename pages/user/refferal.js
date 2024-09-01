import { useRef, useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../api/supabase'
import Head from 'next/head';
import { app } from '../api/firebase';
import Cover from './cover'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import Rd from '../../public/icon/rounds.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { Divider, Typography, Stack, Box } from "@mui/material";
import Image from 'next/image'
import { useRouter } from 'next/router'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import TabPanel from '@mui/lab/TabPanel';
export default function Refferal() {
  const [value, setValue] = useState('1');
  const [xxx, setXxx] = useState(0);
  const months= ["January","February","March","April","May","June","July",
            "August","September","October","November","December"];
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [info, setInfo] = useState({});
  const [lvl, setLvl] = useState([]);
  const [lvlst, setLvlst] = useState([]);
  const router = useRouter()
  const [fshow,setFshow] = useState('All')
  const auth = getAuth(app);
  const [lvl3, setLvl3] = useState([]);
  const isMounted = useRef(true);
  const [refers,setRefers] = useState('')
  useEffect(() => {
    
   const refs = localStorage.getItem('signRef');
    const useri =  localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      setRefers(localStorage.getItem('signRef'))
      const uid =  localStorage.getItem('signUids');
      const name =  localStorage.getItem('signNames');
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
       
        // ...
          console.log(`refer.eq.${refs}`)
      async function getRef(){
        try{
        const {data,error} = await supabase
        .from('users')
        .select('*')
        .or(`refer.eq.${refs},lvla.eq.${refs},lvlb.eq.${refs}`)
        console.log(data)
        setLvl(data)
         setLvlst(data)
        }catch(e){
          console.log(e);
        }
        
      }
      getRef();


        const calculateTotal = () => {
          const sum = lvl.reduce((acc, item) => acc + item.totald, 0);
          setXxx(sum.toFixed(2));
        };
    
        calculateTotal();
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
 


  }, [xxx]);
  async function filterData(tofill){
    setFshow((tofill === 'refer') ? 'Level 1' : (tofill === 'lvla') ? 'Level 2' : 'Level 3');
    const fill = lvlst.filter(i => i[tofill] === refers);
    setLvl(fill);
    console.log(fill)
  }
   async function reMain(){
    setLvl(lvlst)
    setFshow('All')
   }

  const columns = [
    { field: 'statId', headerName: 'ID', width: 50 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: '', headerName: 'Date', width: 90 },
    {
      field: 'level',
      headerName: 'Level',
      type: 'number',
      width: 70,
    },
    {
      field: 'balance',
      headerName: 'Amount',
      type: 'number',
      width: 100,
    },
  ];
  
  var sn = 0;

  return (
    <Cover>
    <div style={{ minHeight: '85vh', width: '100%', overflowX: 'hidden' }}>
      <Stack alignItems="center" style={{ minHeight: '85vh', width: '100%' }} spacing={1}>
        <Head>
          <title>Referral Details</title>
          <link rel="icon" href="/brentford.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Stack direction='row' alignItems='center' justifyContent='start' spacing={1} sx={{ width:'100%',padding: '8px', margin: '2px',minWidth:'344px'}}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#cacaca' }}>Referral</Typography>
      </Stack>
      <Accordion style={{background:'#242627',width:'341px'}}>
        <AccordionSummary
          expandIcon={
             <KeyboardArrowDownIcon sx={{color:'#CACACA',fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300'}}/>
          }
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{width:'100%'}}>
            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500',color:'#cacaca' }}>Referrals({lvl ? lvl.length : '0'})- {xxx} USDT</Typography>
            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#cacaca',padding:'8px' }}>{fshow}</Typography>
        
            </Stack>
           
          </AccordionSummary>
        <AccordionDetails>
        <Typography sx={{ fontSize: '16px',cursor:'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:(fshow === 'Level 1') ? '#808080' : (fshow === 'Level 2') ? '#808080' : (fshow === 'Level 3') ? '#808080' : '#242627',padding:'8px' }} onClick={()=>{ reMain}}>All</Typography>
        <Typography sx={{ fontSize: '16px',cursor:'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:(fshow === 'Level 1') ? '#CACACA' : (fshow === 'Level 2') ? '#808080' : '#808080',padding:'8px' }} onClick={()=>{ filterData('refer')}}>Level 1</Typography>
        <Typography sx={{ fontSize: '16px',cursor:'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:(fshow === 'Level 1') ? '#808080' : (fshow === 'Level 2') ? '#CACACA' : '#808080',padding:'8px' }} onClick={()=>{ filterData('lvla')}}>Level 2</Typography>
        <Typography sx={{ fontSize: '16px',cursor:'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:(fshow === 'Level 1') ? '#808080' : (fshow === 'Level 2') ? '#808080' : '#CACACA',padding:'8px' }} onClick={()=>{ filterData('lvlb')}}>Level 3</Typography>
          
        </AccordionDetails>
      </Accordion>
     <Stack direction='row' justifyContent='space-between' sx={{width:'100%'}}>
      
      
     </Stack>
     <Divider sx={{color:'#CACACA'}}/>
     <Stack direction='column' sx={{ paddingBottom:'50px'}}>
      {
        lvl.map((t)=>{
          let date = new Date(t.crdate);
          let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
          let month = months[date.getMonth()];
          let time = date.getHours()+ ':'+date.getMinutes()
          let balance = t.balance.toFixed(2);
          return(
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems='center' sx={{ padding: '8px' }} key={t.keyf}>
                  <Image src={Rd} width={40} height={40} alt='rounds'/>
                  <Stack direction='column' alignItems='start' sx={{width:'196px'}}>
                    <Stack direction='row' alignItems='center' spacing={1} justifyContent='stretch'>
 <Typography style={{ color:'#CACACA',fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '500' }}>{t.username}
                   </Typography> 
                   <Typography sx={{color:'#808080'}}>•</Typography>
                   <Typography style={{ color:(refers === t.refer) ? '#793D20' : (refers === t.lvla) ? '#5E6172' : '#BE6D07',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '300' }}>
                    {(refers === t.refer) ? 'Level 1' : (refers === t.lvla) ? 'Level 2' : 'Level 3'}
                   </Typography>
                    </Stack>
                   <Typography style={{ color:'#CACACA',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{dates} • {time}</Typography>
                 
                  </Stack>
                  <Typography style={{ color:'#CACACA',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>$ {t.totald ?? 0}</Typography>
                 </Stack>
          )
        })
      }
     </Stack>
      </Stack>
    </div>
    </Cover>
  );
}
