import { useContext, useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../api/supabase'
import Head from 'next/head';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import { Divider, Typography, Stack, Box } from "@mui/material";
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
export default function Refferal() {
  const [value, setValue] = useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [info, setInfo] = useState({});
  const [refs, setRefs] = useState([]);
  const [lvl1, setLvl1] = useState([]);
  const [lvl2, setLvl2] = useState([]);
  const [lvlo, setLvlo] = useState([]);
  const router = useRouter()
  const [lvll, setLvll] = useState([]);
  const auth = getAuth(app);
  const [lvl3, setLvl3] = useState([]);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('userId', user.uid)
          setInfo(data[0])
        }
        GET();
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });
    //get refs
    const getRefs = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`refer.eq.${info.newrefer},lvla.eq.${info.newrefer},lvlb.eq.${info.newrefer}`);
      setRefs(data);
    }
    
    getRefs();
    //end refs
const getCo1=async()=> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('refer', info.newrefer)
    setLvl1(data)
  }
  getCo1()
  async function getCo2() {
    const { data, count } = await supabase
      .from('users')
      .select('*')
      .eq('lvla', info.newrefer)
    setLvl2(data)
  }
  getCo2()
  async function getCo3() {
    const { data, count } = await supabase
      .from('users')
      .select('*')
      .eq('lvlb', info.newrefer)
    setLvl3(data)
  }
  getCo3()
  }, [ lvll, lvlo, refs])
  
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
  const rows = refs;
  var sn = 0;
  return (
    <div style={{ minHeight: '85vh', width: '100%', overflowX: 'hidden' }}>
      <Stack alignItems="center" style={{ minHeight: '85vh', width: '100%' }}>
        <Head>
          <title>Refferal Details</title>
          <link rel="icon" href="/logo_afc.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <CloseIcon style={{ color: 'white', margin: '12px', width: '50px', height: '50px' }}
          onClick={() => {
            router.push('/user/account')
          }}
        />
        <Typography style={{ color: 'white', fontSize: '18px', fontWeight: 'bolder', fontFamily: 'Poppins,sans-serif' }}>Refferal Details</Typography>
        <Stack direction="row" spacing={3}>
          <Box >
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>level 1</Typography>
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>{lvl1.length}</Typography></Box>
          <Divider style={{ background: 'white' }} />
          <Box>
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>level 2</Typography>
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>{lvl2.length}</Typography></Box>
          <Divider style={{ background: 'white' }} />
          <Box>
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>level 3</Typography>
            <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>{lvl3.length}</Typography></Box>
          <Divider style={{ background: 'white' }} />
          <Typography style={{ width: '50px', color: 'white', fontSize: '14px' }}>Total : {lvl1.length + lvl2.length + lvl3.length} </Typography>

        </Stack>
        <Divider style={{ background: 'white' }} />
        <Tabx />
      </Stack>
    </div>
  );
  function Tabx() {
    
    return (
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Level 1" value="1"  sx={{ color:'white'}}/>
            <Tab label="Level 2" value="2" sx={{ color:'white'}}/>
            <Tab label="Level 3" value="3" sx={{ color:'white'}}/>
          </TabList>
        </Box>
        <TabPanel value="1">
          <table>
            <tbody>
              <tr>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>S/N</th>
                <th style={{ width: '100px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Username</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Date/Time</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Balance</th>
              </tr>
              {
                lvl1.map((r) => {
                  sn++;
                  var dts = new Date(r.crdate);

                  return (
                    <tr key={r.username}>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{sn}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{r.username}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{dts.getDate() + '/' + dts.getMonth() + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</th>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{r.balance}</th>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </TabPanel>
        {
          //tab 2
        }
        <TabPanel value="2">
          <table>
            <tbody>
              <tr>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>S/N</th>
                <th style={{ width: '100px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Username</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Date/Time</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Balance</th>
              </tr>
              {
                lvl2.map((r) => {
                  sn++;
                  var dts = new Date(r.crdate);

                  return (
                    <tr key={r.username}>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{sn}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{r.username}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{dts.getDate() + '/' + dts.getMonth() + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</th>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{r.balance}</th>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </TabPanel>
        {
          //tab three
        }
        <TabPanel value="3">
          <table>
            <tbody>
              <tr>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>S/N</th>
                <th style={{ width: '100px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Username</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Date/Time</th>
                <th style={{ width: '50px', color: 'white', fontFamily: 'Poppins,sans-serif' }}>Balance</th>
              </tr>
              {
                lvl3.map((r) => {
                  sn++;
                  var dts = new Date(r.crdate);

                  return (
                    <tr key={r.username}>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{sn}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{r.username}</th>
                      <th style={{ width: '100px', color: 'white', fontSize: '14px' }}>{dts.getDate() + '/' + dts.getMonth() + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</th>
                      <th style={{ width: '50px', color: 'white', fontSize: '14px' }}>{r.balance}</th>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </TabPanel>
      </TabContext>);
  }
}