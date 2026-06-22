import React, { useRef, useEffect, useMemo } from "react";
import { useRouter } from 'next/router'
import Head from "next/head";
import Cover from './cover'
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import { Typography, Divider } from "@mui/material";
import { supabase } from '@/pages/api/supabase'
import Agent from '@/public/bfc1.jpg'
import Agent1 from '@/public/bfc2.jpg'
import Agent2 from '@/public/bfc3.jpg'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Agent3 from '@/public/bfc4.jpg'
import Agent4 from '@/public/bfc5.jpg'
import AnimatedCarousel from '../../components/AnimatedCarousel'
import Loading from "../components/loading";
import Ims from '@/public/simps/ball.png'
import { app } from '@/pages/api/firebase';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getAuth, signOut } from "firebase/auth";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import toast, { Toaster } from 'react-hot-toast';
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay';

const MATCH_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'next3h', label: 'Next 3 hrs' },
  { key: 'next12h', label: 'Next 12 hrs' },
  { key: 'tomorrow', label: 'Tomorrow' },
]

const HOUR_MS = 60 * 60 * 1000

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getFilteredMatches(matches, activeFilter, nowMs = Date.now()) {
  const todayKey = getLocalDateKey(new Date(nowMs))
  const tomorrow = new Date(nowMs)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = getLocalDateKey(tomorrow)

  return (Array.isArray(matches) ? matches : [])
    .map((match) => ({ match, startMs: getMatchStartMs(match) }))
    .filter(({ startMs }) => Number.isFinite(startMs) && startMs > nowMs)
    .sort((a, b) => a.startMs - b.startMs)
    .filter(({ startMs }) => {
      if (activeFilter === 'next3h') return startMs <= nowMs + (3 * HOUR_MS)
      if (activeFilter === 'next12h') return startMs <= nowMs + (12 * HOUR_MS)
      if (activeFilter === 'tomorrow') return getLocalDateKey(new Date(startMs)) === tomorrowKey
      return getLocalDateKey(new Date(startMs)) === todayKey
    })
    .map(({ match }) => match)
}


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


export default function Home() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [username, setUsername] = useState('');
  const hasRun = useRef(false);
  const openr = Boolean(anchorEl);
  const handleClickr = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloser = () => {
    setAnchorEl(null);
  };
  const [footDat, setFootDat] = useState([]);
  const [activeMatchFilter, setActiveMatchFilter] = useState('today');

  //the below controls the loading modal
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  //the end of thellaoding modal control

  const [balance, setBalance] = useState(0)
  const auth = getAuth(app);
  const [draw, setDraw] = useState(false);
  const router = useRouter();
  let loads = 0;
  const visibleMatches = useMemo(() => (
    getFilteredMatches(footDat, activeMatchFilter)
  ), [footDat, activeMatchFilter]);


  useEffect(() => {

    //guild functions (use backend RPC endpoints)
    const Depositing = async (damount, dusername) => {
      try {
        await fetch('/api/rpc/depositor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: dusername, amount: damount })
        })
      } catch (e) { console.log(e) }
    }

    const Chan = async (bets, type) => {
      try {
        await fetch('/api/rpc/chan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bet: bets, des: type })
        })
      } catch (e) { console.log(e) }
    }

    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
      try {
        await fetch('/api/rpc/affbonus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: dusername, sourceUsername: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
        })
      } catch (e) { console.log(e) }
    }

    const NUser = async (reason, username, amount) => {
      const { error } = await supabase
        .from('activa')
        .insert({
          'code': reason,
          'username': username,
          'amount': amount
        });
    }
    //end of functions
    let active = true;
    if (!hasRun.current) {

      console.log('hi')
      // ...
      hasRun.current = true;
    }

    const runer = async () => {
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
        if (!active) return;
        if (result.status !== 'success') {
          toast.error(result.message || 'Unable to load your account')
          return
        }
        setUsername(result.profile.username || '');
        setBalance(Number(result.profile.balance || 0));
      } catch (e) {
        console.log(e)
        toast.error('Unable to load your account')
      }
    }
    runer();

    const getMatch = async () => {
      const nowMs = Date.now()
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('verified', false)
        .gt('tsgmt', nowMs)
        .limit(50)
        .order('tsgmt', { ascending: true });
      if (error) {
        console.log(error)
        setFootDat([])
        return
      }
      setFootDat(data || []);
    }
    getMatch();
    return () => {
      active = false;
    }
  }, [router]);



  return (
    <Stack justifyContent="start" alignItems="center"
      style={{ background: "#06101F", width: '100%', minHeight: '100dvh', overflowX: 'hidden' }}
    >

      <Loading open={open} handleClose={handleClose} />
      <Toaster position="bottom-center" reverseOrder={false} />

      <Cover sx={{ background: '#06101F', minWidth: '100%', minHeight: '100vh' }}>
        <Head>
          <title>Welcome - {username ? `${username}` : 'Loading...'}</title>
          <link rel="icon" href="/european.ico" />
        </Head>
        <Stack sx={{ background: "#06101F", marginTop: '10px', width: '100%', maxWidth: '450px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} spacing={2} >

          <Stack direction="column" spacing={1} style={{ background: '#10284D', width: '100%', maxWidth: '450px', padding: '12px', borderRadius: '10px' }}>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', alignItems: 'center', minWidth: 0 }}>
              <Typography style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: 'auto', textAlign: 'left', color: '#1BB6FF' }} >Hello .</Typography>
              <p className="notranslate" style={{ fontSize: '16px', margin: 0, textAlign: 'left', fontWeight: '600', fontFamily: 'Poppins, sans-serif', minHeight: '24px', padding: '1px', width: 'auto', minWidth: 0, color: '#1BB6FF', overflowWrap: 'anywhere' }}>{username ? ` ${username}` : 'Loading...'}</p>

            </div>

            <Stack direction='row' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={1} >
              <Stack sx={{ minWidth: 0, flex: '1 1 150px' }}>
                <Typography style={{ fontSize: '12px', fontWeight: '400', fontFamily: 'Poppins, sans-serif', height: '24px', padding: '1px', width: '100%', color: '#E9E5DA' }}>Current Balance </Typography>
                <Typography style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', minHeight: '24px', padding: '1px', width: '100%', color: '#E9E5DA', overflowWrap: 'anywhere' }}>{balance ? ` ${balance.toFixed(3)}` : '0'} USDT</Typography>
              </Stack>
              <Link href='/user/fund' style={{ textDecoration: "none", color: 'white', flexShrink: 0 }}>
                <Stack direction='row' justifyContent='center' alignItems='center' sx={{ background: '#1BB6FF', borderRadius: '20px', padding: '8px', width: '95px', height: '32px' }}>
                  <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white', fontSize: '12px' }}>
                    Deposit
                  </Typography>
                  <KeyboardArrowRightIcon sx={{ width: '16px', height: '16px' }} />
                </Stack>
              </Link>
            </Stack>
            <Divider sx={{ bgcolor: "secondary.light" }} />
            < Link href='https://t.me/+wJBTaIqLztoyYzE0' target="_blank" style={{ textDecoration: 'none' }}>
              <Stack direction='row' justifyContent='space-between' sx={{ padding: '8px', minWidth: 0 }} >
                <Stack direction='row' spacing={1} justifyContent='start' sx={{ minWidth: 0 }}>
                  <Icon icon="mingcute:telegram-line" width="24" height="24" style={{ color: '#1BB6FF' }} />

                  <Stack direction='column' spacing={0} justifyContent='start' sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: '#1BB6FF', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif', textDecoration: 'underline' }}>Telegram Channel</Typography>
                    <Typography sx={{ color: '#1BB6FF', fontSize: '12px', fontWeight: 300, fontFamily: 'Inter,sans-serif', textDecoration: 'underline', overflowWrap: 'anywhere' }}>Join our telegram group to earn more</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Link>
          </Stack>
          <Divider sx={{ background: '#E9E5DA' }} />

          <AnimatedCarousel images={[Agent, Agent1, Agent2, Agent3, Agent4]} interval={5000} />

          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ width: '100%', gap: 1 }}>
            <Stack direction='row' spacing={1}>
              <Icon icon="carbon:football-american" width="24" height="24" style={{ color: '#E9E5DA' }} />
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '16px', fontWeight: '600' }}>Top Football Matches</Typography>
            </Stack>
            <Link href="/user/matches" style={{ textDecoration: 'none' }}>
              <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>see all</Typography>
            </Link>
          </Stack>
          <Stack direction='row' spacing={1} sx={{ width: '100%', overflowX: 'auto', pb: 0.5 }}>
            {MATCH_FILTERS.map((filter) => (
              <MatchFilterPill
                key={filter.key}
                label={filter.label}
                active={activeMatchFilter === filter.key}
                onClick={() => setActiveMatchFilter(filter.key)}
              />
            ))}
          </Stack>

          <Stack alignItems='center' sx={{ width: '100%' }}>
            {visibleMatches.map((match) => (
              <DashboardMatchCard
                key={match.match_id}
                match={match}
                onOpen={handleOpen}
                onSelect={(matchId) => router.push(`/user/match/${matchId}`)}
              />
            ))}
          </Stack>

          <Stack>

          </Stack>
        </Stack>
      </Cover>
    </Stack>
  )
}

function MatchFilterPill({ label, active, onClick }) {
  return (
    <Stack
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        flex: '0 0 auto',
        minHeight: 36,
        background: active ? '#1BB6FF' : '#10284D',
        padding: '10px',
        borderRadius: '20px',
        border: 0,
        cursor: 'pointer',
      }}
    >
      <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: active ? '#06101F' : '#E9E5DA', fontSize: '12px', fontWeight: '100', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Stack>
  )
}

function DashboardMatchCard({ match, onOpen, onSelect }) {
  const display = useClientMatchDisplay(match)
  const startMs = display.startMs || getMatchStartMs(match)

  if (startMs && startMs < Date.now()) return null

  const league = (match.league === 'others' ? match.otherl : match.league) || 'League'

  return (
    <Stack
      direction="column"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      sx={{
        mb: 1,
        p: '18.5px',
        background: '#10284D',
        width: '100%',
        maxWidth: '343px',
        boxSizing: 'border-box',
        borderRadius: '5px',
        minHeight: '210px',
        border: match.company ? '1px solid #1BB6FF' : '1px solid transparent',
        cursor: 'pointer',
      }}
      onClick={() => {
        onOpen()
        onSelect(match.match_id)
      }}
    >
      <Stack direction="column" sx={{ width: '100%', minWidth: 0 }}>
        {match.company ? (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            <Icon icon="solar:star-bold-duotone" width="24" height="24" style={{ color: '#1BB6FF', flexShrink: 0 }} />
            <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontSize: 12 }}>
              Verified Company Game
            </Typography>
          </Stack>
        ) : null}
        <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {league}
        </Typography>
        <Divider sx={{ background: '#1BB6FF' }} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 82px minmax(0, 1fr)', alignItems: 'center', gap: 1, width: '100%' }}>
        <DashboardTeam image={match.ihome} name={match.home} />
        <Box sx={{ textAlign: 'center', color: '#E9E5DA', fontFamily: 'Poppins,sans-serif' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 300, lineHeight: 1.3 }}>{display.time}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 300, lineHeight: 1.3 }}>{display.date}</Typography>
        </Box>
        <DashboardTeam image={match.iaway} name={match.away} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, width: '100%' }}>
        <DashboardOdd label="1-0" value={match.onenil} />
        <DashboardOdd label="1-1" value={match.oneone} />
        <DashboardOdd label="1-2" value={match.onetwo} />
      </Box>
    </Stack>
  )
}

function DashboardTeam({ image, name }) {
  return (
    <Stack direction="column" justifyContent="center" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Image src={image || Ims} width={50} height={50} alt={name || 'team'} style={{ objectFit: 'contain' }} unoptimized />
      <Typography
        sx={{
          minHeight: 34,
          textAlign: 'center',
          fontFamily: 'Poppins,sans-serif',
          color: '#E9E5DA',
          fontSize: 12,
          fontWeight: 300,
          lineHeight: 1.35,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflowWrap: 'anywhere',
        }}
      >
        {name || 'Team'}
      </Typography>
    </Stack>
  )
}

function DashboardOdd({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-around" alignItems="center" sx={{ borderRadius: '5px', minWidth: 0, height: 40, background: '#E6E8F3', border: '3px solid #1BB6FF' }}>
      <Typography sx={{ fontSize: 12, fontFamily: 'Poppins,sans-serif', fontWeight: 400, color: '#06101F' }}>{label}</Typography>
      <Typography sx={{ minWidth: 0, fontSize: 16, fontFamily: 'Poppins,sans-serif', fontWeight: 400, color: '#06101F', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Stack>
  )
}
