import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import Head from 'next/head'
import Ims from '@/public/simps/ball.png'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/router'
import Loading from '../components/loading'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay'

function TeamBlock({ image, name, align = 'center' }) {
  return (
    <Box sx={{ minWidth: 0, textAlign: align }}>
      <Box sx={{ display: 'grid', placeItems: 'center' }}>
        <Image src={image || Ims} width={50} height={50} alt={name || 'team'} style={{ objectFit: 'contain' }} />
      </Box>
      <Typography
        sx={{
          mt: 1,
          minHeight: 34,
          color: '#E9E5DA',
          fontFamily: 'Poppins,sans-serif',
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
    </Box>
  )
}

function OddChip({ label, value, company }) {
  return (
    <Box
      sx={{
        height: 40,
        minWidth: 0,
        borderRadius: '5px',
        background: '#E6E8F3',
        border: `3px solid ${company ? '#FFB400' : '#D4AF37'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 0.5,
        px: 0.5,
      }}
    >
      <Typography sx={{ fontSize: 12, fontFamily: 'Poppins,sans-serif', fontWeight: 400, color: '#808080' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          minWidth: 0,
          fontSize: 16,
          fontFamily: 'Poppins,sans-serif',
          fontWeight: 400,
          color: '#808080',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function MatchCard({ match, onOpen, onSelect }) {
  const display = useClientMatchDisplay(match)
  const startMs = display.startMs || getMatchStartMs(match)

  if (startMs && startMs < Date.now()) return null

  const league = (match.league === 'others' ? match.otherl : match.league) || 'League'

  return (
    <Box
      component="button"
      type="button"
      onClick={() => {
        onOpen()
        onSelect(match.match_id)
      }}
      sx={{
        width: '100%',
        maxWidth: 343,
        minHeight: 210,
        mb: 1,
        p: '18px',
        boxSizing: 'border-box',
        borderRadius: '5px',
        border: match.company ? '1px solid #1BB6FF' : '1px solid transparent',
        background: '#10284D',
        color: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          {match.company ? (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <Icon icon="solar:star-bold-duotone" width="24" height="24" style={{ color: '#1BB6FF', flexShrink: 0 }} />
              <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontSize: 12 }}>
                Verified Company Game
              </Typography>
            </Stack>
          ) : null}
          <Typography
            sx={{
              color: '#E9E5DA',
              fontFamily: 'Poppins,sans-serif',
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {league}
          </Typography>
          <Box sx={{ mt: 0.5, height: 1, background: '#1BB6FF' }} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 82px minmax(0, 1fr)',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TeamBlock image={match.ihome} name={match.home} />
          <Box sx={{ textAlign: 'center', color: '#CACACA', fontFamily: 'Poppins,sans-serif' }}>
            <Typography sx={{ fontSize: 14, lineHeight: 1.3 }}>{display.time}</Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.3 }}>{display.date}</Typography>
          </Box>
          <TeamBlock image={match.iaway} name={match.away} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
          <OddChip label="1-0" value={match.onenil} company={match.company} />
          <OddChip label="1-1" value={match.oneone} company={match.company} />
          <OddChip label="1-2" value={match.onetwo} company={match.company} />
        </Box>
      </Stack>
    </Box>
  )
}

export default function Matches({ footDat = [] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const matches = Array.isArray(footDat) ? footDat : []

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <Cover>
      <Loading open={open} handleClose={handleClose} />
      <Head>
        <title>EUROPEAN - Matches</title>
        <meta name="description" content="See the Best Matches Provided By EUROPEAN FC- " />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ width: '100%', maxWidth: 450, minHeight: '90vh', mx: 'auto', px: 1.5, pb: 3, boxSizing: 'border-box', background: '#06101F' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: 24, height: 24, color: '#E9E5DA' }} onClick={() => router.push('/user')} />
          <Typography sx={{ flex: 1, fontSize: 16, color: 'white', fontFamily: 'Poppins,sans-serif', fontWeight: 300, textAlign: 'center', pr: 3 }}>
            Matches
          </Typography>
        </Stack>

        <Stack alignItems="center">
          {matches.map((match) => (
            <MatchCard
              key={match.match_id}
              match={match}
              onOpen={handleOpen}
              onSelect={(matchId) => router.push(`/user/match/${matchId}`)}
            />
          ))}
        </Stack>
      </Box>
    </Cover>
  )
}

export async function getServerSideProps() {
  const { data } = await supabase
    .from('bets')
    .select('*')
    .eq('verified', false)
    .limit(50)
    .order('tsgmt', { ascending: true })

  return {
    props: { footDat: data || [] },
  }
}
