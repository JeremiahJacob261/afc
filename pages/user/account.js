import { Avatar, Paper, Typography, Box, Stack, Button, Divider } from '@mui/material'
import Cover from './cover'
import React, { useRef, useEffect, useState } from "react";
import { useRouter } from 'next/router'
import Link from 'next/link';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { supabase } from '@/pages/api/supabase'
import Head from 'next/head';
import Image from 'next/image';
import profile from '@/public/prof.png'
import { app } from '@/pages/api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Icon } from '@iconify/react'

import { CookiesProvider, useCookies } from 'react-cookie';
import toast, { Toaster } from 'react-hot-toast';
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import AppLoadingOverlay from '@/components/AppLoadingOverlay';
import { waitForPaint } from '@/lib/uiFeedback';
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import { useTranslation } from 'next-i18next';


async function processBets(name) {
  try {
    await fetch('/api/rpc/process_bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    console.log('Bets processed for', name)
  } catch (err) {
    console.error('Error processing bets:', err)
  }
}

export default function Account() {
  const { t } = useTranslation('common')
  const [, setCookie] = useCookies([]);
  const hasRun = useRef(false);
  const auth = getAuth(app);
  const [username, setUsername] = useState('')
  const router = useRouter()
  const [info, setInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false);
  const [refCount, setRefCount] = useState(0);
  const [viplevel, setViplevel] = useState(1);
  const handleClosed = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpened(false);
  };
  let loads = 0;
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [accountActionLoading, setAccountActionLoading] = useState(false)
  //end of snackbar1
  useEffect(() => {
    let active = true

    async function loadProfile() {
      const session = await requireSession(router)
      if (!session) return

      clearLegacyAuthStorage()

      try {
        const response = await authFetch('/api/me')
        if (response.status === 401 || response.status === 404) {
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        const result = await response.json()
        if (!active || result.status !== 'success') return

        setInfo(result.profile)
        setUsername(result.profile.username || '')
        setBalance(Number(result.profile.balance || 0))
        setRefCount(result.referralCount || 0)
        setViplevel(result.vip?.viplevel || 1)

        if (!hasRun.current) {
          hasRun.current = true
        }
      } catch (e) {
        console.log(e)
        toast.error(t('messages.unableLoadProfile'))
      } finally {
        if (active) setLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [router, t]);

  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  //snackbar2

  function Sncks() {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
        <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
          {t('messages.inviteLinkCopied')}
        </Alert>
      </Snackbar>
    )
  }
  const signOutAccount = async () => {
    if (accountActionLoading) return

    setAccountActionLoading(true)
    await waitForPaint()

    try {
      const { error } = await supabase.auth.signOut();
      console.log('sign out');
      console.log(error);
      clearLegacyAuthStorage();
      setCookie('authdata', '', { path: '/', expires: new Date(0) });
      setCookie('authed', '', { path: '/', expires: new Date(0) });
      router.push('/login');
    } catch (error) {
      console.log(error)
      toast.error(t('messages.anErrorOccurred'))
      setAccountActionLoading(false)
    }
  }
  //end of snackbar2
  return (
    <Cover style={{ width: "100%", paddingBottom: '100px' }}>
      <AppLoadingOverlay open={accountActionLoading} title={t('common.signOut')} message="" />
      <Toaster position="bottom-center"
        reverseOrder={false} />
      <Sncks />
      <Head>
        <title>{`${username || t('status.pending')} ${t('common.account')}`}</title>
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box className="account-wrap" sx={{ padding: "8px", background: "#06101F", width: '100%', minHeight: '90vh', paddingBottom: '5vh' }}>
        <div className="page-decor" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <symbol id="ball" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
                <g fill="currentColor" opacity="0.9">
                  <path d="M32 10 L24 26 L32 34 L40 26 Z" />
                  <path d="M32 54 L24 38 L32 30 L40 38 Z" />
                </g>
              </symbol>
            </defs>
            <g fill="#ffffff" opacity="0.04">
              <use href="#ball" x="80" y="60" width="120" height="120" />
              <use href="#ball" x="980" y="140" width="160" height="160" />
              <use href="#ball" x="520" y="420" width="200" height="200" />
            </g>
          </svg>
        </div>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '5px', margin: '2px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ color: "#E9E5DA", width: '24px', height: '24px' }} onClick={() => {
            router.push('/user')
          }} />
          <Typography sx={{ color: "#E9E5DA", fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>{t('common.profile')}</Typography>
        </Stack>
        {
          //start of profile
        }
        <Stack spacing={4} className="dark-glass" sx={{ minWidth: '344px' }}>
          <Stack spacing={1} sx={{ background: 'inherit', padding: '8px', borderRadius: '5px' }}>
            <Stack direction='row' spacing={2} sx={{ padding: '8px' }} alignItems='center' justifyContent={"start"}>
              <Image src={profile} width={50} height={50} alt="profile" />
              <Stack direction='column' spacing={0}>
                <Stack direction="row">
                  <Typography sx={{ color: "#FFFFFF", fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins, sans-serif' }}>{t('mobile.profile.hello')}</Typography>
                  <p className="notranslate" style={{ color: "#FFFFFF", fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins, sans-serif' }}>{username || (loadingProfile ? t('status.pending') : t('common.account'))}</p>
                </Stack>
                <Typography sx={{ color: "#E9E5DA", fontSize: '14px', fontWeight: '300', fontFamily: 'Poppins, sans-serif', width: '50px', textAlign: 'start' }}>VIP {viplevel}</Typography>
              </Stack>
            </Stack>
            <Stack style={{ padding: '8px', borderRadius: '10px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack>
                <Typography style={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#E9E5DA' }}>{t('common.currentBalance')}</Typography>
                <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#E9E5DA' }}>{balance.toFixed(3)} USDT</Typography>
              </Stack>
              <Link href='/user/fund' style={{ textDecoration: "none", color: 'white' }}>
                <Stack style={{ background: '#1BB6FF', borderRadius: '20px', padding: '8px', width: '95px', height: '32px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#10284D', fontSize: '12px' }}>
                    {t('common.deposit')}
                  </Typography>
                  <KeyboardArrowRightIcon sx={{ width: '16px', height: '16px', color: "#10284D" }} />
                </Stack>
              </Link>
            </Stack>
            <Divider sx={{ bgcolor: "#1BB6FF" }} />
            < Link href='https://t.me/+e1nirNMro8A4NWVk' style={{ textDecoration: 'none' }}>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="mingcute:telegram-line" width="24" height="24" style={{ color: '#a3a3a3' }} />

                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.telegramChannel')}</Typography>
                </Stack>
              </Stack>
            </Link>
          </Stack>
          {
            //deposit
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.referralsTitle')}</Typography>

            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', height: '110px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} alignItems="center">
                <Stack direction='row' spacing={1} justifyContent='center' alignItems="center">
                  <Icon icon="ant-design:link-outlined" width="24" height="24" style={{ color: "#a3a3a3" }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>register/{info?.newrefer || ''}</Typography>
                </Stack>
                <Icon icon="solar:copy-bold-duotone" width="24" height="24" style={{ color: '#a3a3a3' }} onClick={() => {
                  if (!info?.newrefer) return
                  navigator.clipboard.writeText("https://europeanfc01.com/register/" + info.newrefer)
                  setMessages(t('messages.inviteLinkCopied'))
                  toast.success(t('messages.inviteLinkCopied'))
                }} />
              </Stack>
              <Divider sx={{ bgcolor: "#1BB6FF" }} />
              <Stack direction='row' justifyContent='space-between' alignItems={"center"} sx={{ padding: '8px', cursor: 'pointer' }}
                onClick={() => {
                  router.push('/user/refferal');
                }}>
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="carbon:diagram-reference" width="24" height="24" style={{ color: !info?.firstd ? '#a3a3a3' : 'lightgreen' }} />
                  <Typography sx={{ color: !info?.firstd ? '#a3a3a3' : 'lightgreen', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.allReferral')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of deposit
          }
          {
            //fun
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('common.deposit')}</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', height: '110px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px' }} onClick={() => {
                router.push('/user/fund');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems={"center"} style={{ cursor: 'pointer' }}>
                  <Icon icon="streamline:money-atm-card-3-deposit-money-payment-finance-atm-withdraw" width="24" height="24" style={{ color: "#a3a3a3" }} />
                  <Typography sx={{ color: '#E9E5DA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.fundAccount')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/vip');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems={"center"}>
                  <Icon icon="icon-park-twotone:diamond-one" width="24" height="24" style={{ color: "#1BB6FF" }} />
                  <Typography sx={{ color: '#E9E5DA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.vipProgress')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //withdraw
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.withdrawalTitle')}</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '150px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/withdraw');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="uil:money-withdraw" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('common.withdraw')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />

              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/history');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="ri:history-line" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.history')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />

              <Stack direction='row' justifyContent='space-between' alignItems="center" sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/codesetting');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="iconamoon:lock-light" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.codeSetting')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />

              <Stack direction='row' justifyContent='space-between' alignItems="center" sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/bindwallet');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="icon-park-twotone:connect" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.linkWallets')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of withdraw
          }
          {
            //fun
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.betsTitle')}</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push('/user/bets');
              }}>
                <Stack direction='row' spacing={1} justifyContent='start' alignItems="center">
                  <Icon icon="mdi:clipboard-text-history-outline" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('common.myBets')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of fund
          }
          {
            //About
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.aboutTitle')}</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                router.push("/user/faq")
              }
              }>
                <Stack direction='row' spacing={1} justifyContent='start'>
                  <Icon icon="streamline:interface-help-question-circle-circle-faq-frame-help-info-mark-more-query-question" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('common.faq')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>



              <Divider sx={{ bgcolor: "#1BB6FF" }} />
              < Link href='https://t.me/EFC_Support' style={{ textDecoration: 'none' }}>
                <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                  <Stack direction='row' spacing={1} justifyContent='start'>
                    <Icon icon="mingcute:telegram-line" width="24" height="24" style={{ color: '#a3a3a3' }} />

                    <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.customerService')}</Typography>
                  </Stack>
                  <KeyboardArrowRightIcon width={24} height={24} />
                </Stack>
              </Link>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />
              < Link href='https://t.me/+e1nirNMro8A4NWVk' style={{ textDecoration: 'none' }}>
                <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                  <Stack direction='row' spacing={1} justifyContent='start'>
                    <Icon icon="mingcute:telegram-line" width="24" height="24" style={{ color: '#a3a3a3' }} />

                    <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.telegramGroup')}</Typography>
                  </Stack>
                  <KeyboardArrowRightIcon width={24} height={24} />
                </Stack>
              </Link>

              <Divider sx={{ bgcolor: "#1BB6FF" }} />

              < Link href='https://t.me/EFC_Support' style={{ textDecoration: 'none' }}>
                <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px' }} >
                  <Stack direction='row' spacing={1} justifyContent='start'>
                    <Icon icon="mdi:support" width="24" height="24" style={{ color: '#a3a3a3' }} />
                    <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.contact')}</Typography>
                  </Stack>
                  <KeyboardArrowRightIcon width={24} height={24} />
                </Stack>
              </Link>
            </Stack>
          </Stack>
          {
            //end of About
          }
          {
            //close
          }
          <Stack direction='column' spacing={1} style={{ background: '#10284D', padding: '12px', borderRadius: "5px", border: '1px solid #1BB6FF' }}>
            <Typography sx={{ color: "#1BB6FF", fontSize: '16px', fontWeight: '400', fontFamily: 'Inter,sans-serif' }}>{t('mobile.profile.closureTitle')}</Typography>
            <Divider />
            <Stack spacing={1} justifyContent="center" sx={{ paddingTop: '16px', paddingBottom: '16px', minHeight: '50px', padding: '8px', background: '#06101F', borderRadius: '8px' }}>

              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ padding: '8px', cursor: 'pointer' }}
                onClick={signOutAccount}>
                <Stack direction='row' spacing={1} justifyContent='start' >
                  <Icon icon="hugeicons:logout-05" width="24" height="24" style={{ color: '#a3a3a3' }} />
                  <Typography sx={{ color: '#E9E5DA', verticallyAlign: 'center', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('common.signOut')}</Typography>
                </Stack>
                <KeyboardArrowRightIcon width={24} height={24} />
              </Stack>
            </Stack>
          </Stack>
          {
            //end of close
          }
        </Stack>
        {
          //end of profile
        }
      </Box>
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
