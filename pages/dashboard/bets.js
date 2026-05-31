import Cover from './cover'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { Box, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import Loading from '@/pages/components/loading'
import Ims from '@/public/simps/ball.png'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay'

const colors = {
  page: '#06101F',
  card: '#0B1628',
  cardAlt: '#0F2138',
  border: '#1D3658',
  accent: '#1BB6FF',
  accentDark: '#0B2B45',
  text: '#F7F9FC',
  muted: '#9EABB9',
  soft: '#D8DEE8',
  warning: '#F5B942',
  success: '#39D98A',
  danger: '#FF6B7A',
}

const tabs = [
  { value: '1', label: 'Unsettled' },
  { value: '2', label: 'Settled' },
]

const toNumber = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

const formatUsdt = (value) => `${toNumber(value).toFixed(3)} USDT`

const getBetStatus = (bet) => {
  const startTime = getMatchStartMs(bet)
  const hasFutureStart = Boolean(startTime && startTime > Date.now())

  if (hasFutureStart) {
    return { label: 'Not Started', color: colors.muted, bg: '#121E2D' }
  }

  if (bet.won === 'true') {
    return { label: 'Won', color: colors.success, bg: '#0F2C24' }
  }

  if (bet.won === 'false') {
    return { label: 'Lost', color: colors.danger, bg: '#321923' }
  }

  return { label: 'Ongoing', color: colors.warning, bg: '#302816' }
}

export default function Bets() {
  const router = useRouter()
  const [openx, setOpenx] = useState(false)
  const [bets, setBets] = useState([])
  const [fina, setFina] = useState([])
  const [value, setValue] = useState('1')
  const hasRun = useRef(false)

  const handleOpenx = () => setOpenx(true)
  const handleClosex = () => setOpenx(false)

  useEffect(() => {
    let active = true

    const getbets = async () => {
      const session = await requireSession(router)
      if (!session) return
      clearLegacyAuthStorage()

      try {
        const response = await authFetch('/api/my-bets')
        if (response.status === 401 || response.status === 404) {
          router.push('/signin')
          return
        }

        const result = await response.json()
        if (!active || result.status !== 'success') return
        setBets(result.unsettled || [])
        setFina(result.settled || [])
      } catch (e) {
        console.log(e)
      }
    }

    getbets()
    if (!hasRun.current) {
      hasRun.current = true
    }

    return () => {
      active = false
    }
  }, [router])

  const currentBets = value === '1' ? bets : fina
  const summary = useMemo(() => {
    const totalStake = [...bets, ...fina].reduce((sum, bet) => sum + toNumber(bet.stake), 0)
    const won = fina.filter((bet) => bet.won === 'true').length

    return [
      { label: 'Open', value: bets.length },
      { label: 'Settled', value: fina.length },
      { label: 'Won', value: won },
      { label: 'Stake', value: formatUsdt(totalStake) },
    ]
  }, [bets, fina])

  return (
    <Cover>
      <Loading open={openx} handleClose={handleClosex} />
      <Head>
        <title>EFC - My Bets</title>
        <meta name="description" content="View your recent bet slips" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box sx={{ minHeight: '90vh', pb: 3, color: colors.text }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
          <Box
            component="button"
            type="button"
            aria-label="Back to dashboard"
            onClick={() => router.push('/dashboard')}
            sx={{
              width: 36,
              height: 36,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              background: colors.card,
              color: colors.text,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              p: 0,
            }}
          >
            <KeyboardArrowLeftOutlinedIcon sx={{ width: 24, height: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 18, fontFamily: 'Poppins,sans-serif', fontWeight: 600 }}>
              Bet History
            </Typography>
          </Box>
        </Stack>

        <SummaryGrid items={summary} />
        <BetTabs value={value} onChange={setValue} />
        <BetList bets={currentBets} emptyLabel={value === '1' ? 'No unsettled bets yet' : 'No settled bets yet'} onOpen={handleOpenx} />
      </Box>
    </Cover>
  )

  function BetList({ bets: betItems, emptyLabel, onOpen }) {
    if (!betItems.length) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            mt: 2,
            minHeight: 260,
            border: `1px dashed ${colors.border}`,
            borderRadius: '8px',
            background: colors.card,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: colors.text, fontFamily: 'Poppins,sans-serif', fontWeight: 600 }}>
            {emptyLabel}
          </Typography>
          <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>
            Your bet slips will appear here after you place them.
          </Typography>
        </Stack>
      )
    }

    return (
      <Stack spacing={1.5} direction="column-reverse" sx={{ mt: 2 }}>
        {betItems.map((bet) => (
          <BetCard
            key={bet.betid}
            bet={bet}
            onClick={() => {
              onOpen()
              router.push(`/dashboard/viewbet/${bet.betid}`)
            }}
          />
        ))}
      </Stack>
    )
  }

  function BetCard({ bet, onClick }) {
    const status = getBetStatus(bet)
    const returnAmount = toNumber(bet.stake) + toNumber(bet.profit)
    const display = useClientMatchDisplay(bet)

    return (
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          width: '100%',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          background: colors.card,
          color: colors.text,
          p: 0,
          textAlign: 'left',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Team name={bet.home} image={bet.ihome} />
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', color: colors.warning, fontSize: 12, fontWeight: 700 }}>
              VS
            </Typography>
            <Team name={bet.away} image={bet.iaway} align="right" />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ background: colors.cardAlt, borderRadius: '8px', p: 1 }}>
            <Box>
              <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 11 }}>
                Market
              </Typography>
              <Typography sx={{ color: colors.text, fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600 }}>
                {bet.market || 'Market'}
              </Typography>
            </Box>
            <StatusPill status={status} />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            <Metric label="Odds" value={`${bet.odd || '0'}%`} />
            <Metric label="Stake" value={formatUsdt(bet.stake)} />
            <Metric label="Profit" value={formatUsdt(returnAmount)} />
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            background: '#081223',
            borderTop: `1px solid ${colors.border}`,
            px: 1.5,
            py: 1,
          }}
        >
          <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 12 }}>
            Kickoff: {display.dateTime}
          </Typography>
          <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Bet ID: {bet.betid}
          </Typography>
          <ArrowForwardIosRoundedIcon sx={{ width: 14, height: 14, color: colors.accent }} />
        </Stack>
      </Box>
    )
  }
}

function SummaryGrid({ items }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 1,
        my: 1.5,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            background: colors.card,
            p: 1.25,
            minHeight: 72,
          }}
        >
          <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 11 }}>
            {item.label}
          </Typography>
          <Typography sx={{ color: colors.text, fontFamily: 'Poppins,sans-serif', fontSize: item.label === 'Stake' ? 15 : 20, fontWeight: 700 }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

function BetTabs({ value, onChange }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 1,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        background: '#081223',
        p: 0.5,
      }}
    >
      {tabs.map((tab) => {
        const selected = value === tab.value

        return (
          <Box
            key={tab.value}
            component="button"
            type="button"
            onClick={() => onChange(tab.value)}
            sx={{
              minHeight: 42,
              border: 0,
              borderRadius: '6px',
              background: selected ? colors.accentDark : 'transparent',
              color: selected ? colors.text : colors.muted,
              fontFamily: 'Poppins,sans-serif',
              fontSize: 13,
              fontWeight: selected ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </Box>
        )
      })}
    </Box>
  )
}

function Team({ name, image, align = 'left' }) {
  return (
    <Stack
      direction={align === 'right' ? 'row-reverse' : 'row'}
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0, flex: 1 }}
    >
      <Box sx={{ width: 28, height: 28, flex: '0 0 auto', borderRadius: '50%', overflow: 'hidden', background: '#15243A' }}>
        <Image src={image ?? Ims} width={28} height={28} alt="" />
      </Box>
      <Typography
        sx={{
          color: colors.text,
          fontFamily: 'Poppins,sans-serif',
          fontSize: 13,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: align,
        }}
      >
        {name || 'Team'}
      </Typography>
    </Stack>
  )
}

function Metric({ label, value }) {
  return (
    <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', p: 1, minWidth: 0 }}>
      <Typography sx={{ color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 11 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: colors.soft,
          fontFamily: 'Poppins,sans-serif',
          fontSize: 12,
          fontWeight: 700,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function StatusPill({ status }) {
  return (
    <Typography
      component="span"
      sx={{
        color: status.color,
        background: status.bg,
        border: `1px solid ${status.color}40`,
        borderRadius: '999px',
        px: 1,
        py: 0.4,
        fontFamily: 'Poppins,sans-serif',
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {status.label}
    </Typography>
  )
}
