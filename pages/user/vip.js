import { Typography, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import { supabase } from '@/pages/api/supabase'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import DiamondIcon from '@mui/icons-material/Diamond';
import { useRouter } from 'next/router'
import Cover from './cover'
import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Logo from '@/public/logoclean.png'
import Head from 'next/head'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { useTranslation } from 'next-i18next';
export default function Vip() {
  const { t } = useTranslation('common');
  const [rprogress, setRProgress] = useState(0);
  const [cprogress, setCProgress] = useState(0);
  const [refCount, setRefCount] = useState(0);
  const [viplevel, setViplevel] = useState(1);
  const router = useRouter()
  const [info, setInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  const [c1, setC1] = useState(0);
  const [r1, setR1] = useState(0);

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
    let active = true;

    const GET = async () => {
      const session = await requireSession(router);
      if (!session) return;
      clearLegacyAuthStorage();

      try {
        const response = await authFetch('/api/me');
        if (response.status === 401 || response.status === 404) {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        const result = await response.json();
        if (!active || result.status !== 'success') return;

        setInfo(result.profile);
        setBalance(Number(result.profile.balance || 0));
        setRefCount(result.referralCount || 0);
        setViplevel(result.vip?.viplevel || 1);
        setRProgress(result.vip?.depositProgress || 0);
        setCProgress(result.vip?.referralProgress || 0);
        setR1(Number((result.vip?.depositProgress || 0).toFixed(2)));
        setC1(Number((result.vip?.referralProgress || 0).toFixed(2)));
      } catch (e) {
        console.log(e)
      }
    }

    GET();

    return () => {
      active = false;
    }

  }, [router]);

  return (
    <Cover>
      <Head>
        <title>{t('mobile.profile.vipProgress')}</title>
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction='row' alignItems='center' justifyContent='left' spacing={1} sx={{ width: '100%' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#E9E5DA' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#E9E5DA' }}>VIP</Typography>
      </Stack>
      <Stack justifyContent='center' alignItems='center' direction='column' sx={{ minHeight: '90vh' }}>

        <DiamondIcon sx={{ width: '200px', height: '200px', color: '#E9E5DA', backdropFilter: 'blur(10px)' }} />
        <Typography variant='h3' sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', opacity: 0.7 }}>VIP {viplevel}</Typography>

        <Stack justifyContent='left' alignItems='left'>
          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.vip.totalDeposit')}</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={(Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))} sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{(Number(rprogress.toFixed(2)) > 100) ? 100 : Number(rprogress.toFixed(2))}%</Typography>
            </Stack>
          </Stack>

          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.vip.referrals')}</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={(Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2))} sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{(Number(cprogress.toFixed(2)) > 100) ? 100 : Number(cprogress.toFixed(2))}%</Typography>
            </Stack>
          </Stack>

          <Stack>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.vip.total')}</Typography>
            <Stack direction='row' justifyContent='left' alignItems='center' spacing={2}>
              <BorderLinearProgress variant="determinate" value={(r1 + c1) / 2} sx={{ width: '230px' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{(r1 + c1) / 2}%</Typography>
            </Stack>
          </Stack>
        </Stack>

      </Stack>
    </Cover>
  )
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return {
    props: {
      ...i18nProps,
    },
  }
}
