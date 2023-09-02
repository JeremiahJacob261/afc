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
import TabPanel from '@mui/lab/TabPanel';
export default function Refferal() {
  const [value, setValue] = useState('1');

  const months= ["January","February","March","April","May","June","July",
            "August","September","October","November","December"];
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [info, setInfo] = useState({});
  const [lvl, setLvl] = useState([]);
  const [lvl1, setLvl1] = useState([]);
  const [lvl2, setLvl2] = useState([]);
  const [lvlo, setLvlo] = useState([]);
  const router = useRouter()
  const [lvll, setLvll] = useState([]);
  const auth = getAuth(app);
  const [lvl3, setLvl3] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
        refers = localStorage.getItem('signRef');
   
    const useri =  localStorage.getItem('signedIn');
    if (useri) {
        console.log(refers)
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid =  localStorage.getItem('signUid');
      const name =  localStorage.getItem('signName');
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
       
        // ...
        async function getCo1() {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('refer', refers)
          setLvl1(data)
          console.log(data)
          }
          getCo1()
          async function getCo2() {
          const { data, count } = await supabase
            .from('users')
            .select('*')
            .eq('lvla', refers)
          setLvl2(data)
          console.log(data)
          }
          getCo2()
          async function getCo3() {
          const { data, count } = await supabase
            .from('users')
            .select('*')
            .eq('lvlb', refers)
          setLvl3(data)
          console.log(data)
          }
          getCo3();
          const merged = lvl1.concat(lvl2, lvl3);
    merged.sort((a, b) => new Date(a.crdate) - new Date(b.crdate));
    setLvl(merged);

        
     
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
  
  }, [])
     
 

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
          <link rel="icon" href="/logo_afc.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Stack direction='row' alignItems='center' justifyContent='start' spacing={1} sx={{ width:'100%',padding: '8px', margin: '2px',minWidth:'344px'}}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Referral</Typography>
      </Stack>
     <Stack direction='row' justifyContent='space-between' sx={{width:'100%'}}>
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>Referrals({lvl.length})</Typography>
     <Stack direction='row' alignItems='center'>
     <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>All</Typography>
     <KeyboardArrowDownIcon sx={{color:'black',fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300'}}/>
     </Stack>
     </Stack>
     <Divider sx={{color:'black'}}/>
     <Stack direction='column'>
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
 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '16px', fontWeight: '500' }}>{t.username}
                   </Typography> 
                   <Typography sx={{color:'#808080'}}>•</Typography>
                   <Typography style={{ color:(refers === t.refer) ? '#793D20' : (refers === t.lvla) ? '#5E6172' : '#BE6D07',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '300' }}>
                    {(refers === t.refer) ? 'Level 1' : (refers === t.lvla) ? 'Level 2' : 'Level 3'}
                   </Typography>
                    </Stack>
                   <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{dates} • {time}</Typography>
                 
                  </Stack>
                  <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>$ {balance}</Typography>
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
