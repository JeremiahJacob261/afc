import { Typography, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import { supabase } from '../api/supabase'
import DiamondIcon from '@mui/icons-material/Diamond';
import { useRouter } from 'next/router'
import Cover from './cover'
import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Logo from '../../public/logoclean.png'
export default function Vip() {
  const [rprogress, setRProgress] = useState(0);
  const [cprogress, setCProgress] = useState(0);
  const [refCount, setRefCount] = useState(0);
  const [viplevel, setViplevel] = useState(1);
  const [usern, setUsern] = useState('')
  const [userR, setUserR] = useState('')
  const router = useRouter()
  const [info, setInfo] = useState([]);
  const [balance, setBalance] = useState(0);
  //end border
  const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8',
    },
  }));
  //endborder
  //vip object
  const viplimit = {
    '1': 50,
    '2': 100,
    '3': 200,
    '4': 300,
    '5': 500,
    '6': 1000,
    '7': 5000
  };
  const vipclimit = {
    '1': 3,
    '2': 5,
    '3': 8,
    '4': 12,
    '5': 15,
    '6': 20,
    '7': 500
  };
  const viproyal = {
    '1': '#CD7F32P',
    '2': '#71706E',
    '3': '#FFD700',
    '4': '#36F1CD',
    '5': '#0F52BA',
    '6': '#E01157',
    '7': '#CF1259'
  };
  // end vip object
  useEffect(() => {
    const useri = localStorage.getItem('signedIn');
    setUsern(localStorage.getItem('signName'));
    setUserR(localStorage.getItem('signRef'));
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      console.log('...')
      // ...

      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', localStorage.getItem('signName'))
          setInfo(data[0])
          setBalance(data[0].balance);
          console.log(refCount)
          localStorage.setItem('signRef', data[0].newrefer);
          async function getReferCount() {
            try {
              const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .match({
              'refer':localStorage.getItem('signRef'),
              'firstd':true
            });
              setRefCount(count)
              setViplevel((info.totald < 50 || count < 3) ? '1' : (info.totald < 100 || count < 5) ? '2' : (info.totald < 200 || count < 8) ? '3' : (info.totald < 300 || count < 12) ? '4' : (info.totald < 500 || count < 15) ? '5' : (info.totald < 1000 || count < 20) ? '6' : '7');
              let vipl = (info.totald < 50 || count < 3) ? '1' : (info.totald < 100 || count < 5) ? '2' : (info.totald < 200 || count < 8) ? '3' : (info.totald < 300 || count < 12) ? '4' : (info.totald < 500 || count < 15) ? '5' : (info.totald < 1000 || count < 20) ? '6' : '7';
              setRProgress((parseInt(info.totald) / parseInt(viplimit[vipl])) * 100);
              setCProgress((parseInt(count) / parseInt(vipclimit[vipl])) * 100)
              console.log(data[0])
            } catch (e) {
              console.log(e)
            }
          }
          getReferCount();
        } catch (e) {
          console.log(e)
        }

      }
      GET();

    } else {
      // User is signed out
      // ...
      const sOut = async () => {
        const { error } = await supabase.auth.signOut();
        console.log('sign out');
        console.log(error);
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
      sOut();
    }
    console.log(info)
    //  console.log((info.totald < 20) ? '0' : (info.totald < 50) ? '1' : (info.totald < 100) ? '2' : (info.totald < 200) ? '3' : (info.totald < 300) ? '4' : (info.totald < 500) ? '5' : (info.totald < 1000) ? '6' : '7')

  }, [balance]);
  return (
    <Cover>
      <Stack direction='row' alignItems='center' justifyContent='left' spacing={1} sx={{ width: '100%' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>VIP</Typography>
      </Stack>
      <Stack justifyContent='center' alignItems='center' direction='column' sx={{ minHeight: '90vh' }}>

        <DiamondIcon sx={{ width: '200px', height: '200px', color: viproyal[viplevel],backdropFilter: 'blur(10px)' }} />
        <Typography variant='h3' sx={{ fontFamily: 'Poppins,sans-serif', color: viproyal[viplevel], opacity: 0.7 }}>VIP {viplevel}</Typography>

        <Stack justifyContent='left' alignItems='left'>
          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>Total Deposit</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={(Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))} sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>{(Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))}%</Typography>
            </Stack>
          </Stack>

          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>Referrals</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={(Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2))} sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>{(Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2))}%</Typography>
            </Stack>
          </Stack>

          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>Total</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={ ((  (Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2)) + (Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))  )/2) } sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif' }}>{ ((  (Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2)) + (Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))  )/2).toFixed(2) }%</Typography>
            </Stack>
          </Stack>
        </Stack>

      </Stack>
    </Cover>
  )
}