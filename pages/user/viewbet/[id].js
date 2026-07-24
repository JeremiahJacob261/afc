import Head from 'next/head'
import Image from 'next/image'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import Cover from '../cover'
import Ball from '@/public/simps/ball.png'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

const colors = {
  page: '#06101F',
  card: '#0B1628',
  cardAlt: '#0F2138',
  border: '#1D3658',
  accent: '#1BB6FF',
  text: '#F7F9FC',
  muted: '#9EABB9',
  soft: '#D8DEE8',
  warning: '#F5B942',
  success: '#39D98A',
  danger: '#FF6B7A',
}

const toNumber = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

const formatFcfa = (value) => `${Math.round(toNumber(value)).toLocaleString()} FCFA`

function getStatus(bet, t) {
  const future = Boolean(getMatchStartMs(bet) && getMatchStartMs(bet) > Date.now())
  if (future) return { label: t('status.notStarted'), color: colors.muted, bg: '#121E2D' }
  if (String(bet.won) === 'true') return { label: t('status.won'), color: colors.success, bg: '#0F2C24' }
  if (String(bet.won) === 'false') return { label: t('status.lost'), color: colors.danger, bg: '#321923' }
  return { label: t('status.processing'), color: colors.warning, bg: '#302816' }
}

export default function ViewBet() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [bet, setBet] = useState({})
  const [league, setLeague] = useState({})
  const [loading, setLoading] = useState(true)
  const matchDisplay = useClientMatchDisplay(bet)

  useEffect(() => {
    let active = true

    async function loadBet() {
      const session = await requireSession(router)
      if (!session) return
      clearLegacyAuthStorage()

      try {
        const response = await authFetch(`/api/my-bet?id=${encodeURIComponent(router.query.id)}`)
        if (response.status === 401 || response.status === 404) {
          router.push(response.status === 401 ? '/login' : '/user/bets')
          return
        }

        const result = await response.json()
        if (!active || result.status !== 'success') return
        setBet(result.bet || {})
        setLeague(result.match || {})
      } catch (error) {
        console.error(error)
      } finally {
        if (active) setLoading(false)
      }
    }

    if (router.query.id) loadBet()
    return () => { active = false }
  }, [router])

  const status = getStatus(bet, t)
  const returnAmount = toNumber(bet.aim) || toNumber(bet.stake) + toNumber(bet.profit)
  const leagueName = league.otherl || league.league || '—'

  return (
    <Cover>
      <Head>
        <title>{`EFC - ${t('mobile.bets.details')}`}</title>
        <meta name="description" content="View the details of your bet" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box sx={{ minHeight: '90vh', pb: 3, color: colors.text }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
          <Box component="button" type="button" aria-label="Back to my bets" onClick={() => router.push('/user/bets')} sx={backButtonSx}>
            <KeyboardArrowLeftOutlinedIcon sx={{ width: 24, height: 24 }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontFamily: 'Poppins,sans-serif', fontWeight: 600 }}>
            {t('mobile.bets.details')}
          </Typography>
        </Stack>

        {loading ? <LoadingState /> : <BetDetails />}
      </Box>
    </Cover>
  )

  function BetDetails() {
    return (
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Box sx={cardSx}>
          <Stack spacing={1.5} sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Team name={bet.home} image={bet.ihome} />
              <Typography sx={{ color: colors.warning, fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 700 }}>VS</Typography>
              <Team name={bet.away} image={bet.iaway} align="right" />
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ background: colors.cardAlt, borderRadius: '8px', p: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={labelSx}>{t('mobile.bets.league')}</Typography>
                <Typography sx={{ ...valueSx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leagueName}</Typography>
              </Box>
              <StatusPill status={status} />
            </Stack>
          </Stack>
        </Box>

        <Box sx={cardSx}>
          <SectionTitle icon={<EmojiEventsOutlinedIcon />} title={t('mobile.bets.pick')} />
          <Stack spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
            <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.cardAlt, p: 1.25 }}>
              <Typography sx={labelSx}>{t('mobile.bets.pick')}</Typography>
              <Typography sx={{ ...valueSx, mt: 0.4 }}>{bet.market || '—'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
              <Metric label={t('mobile.bets.odds')} value={`${bet.odd || '0'}%`} />
              <Metric label={t('mobile.bets.stake')} value={formatFcfa(bet.stake)} />
              <Metric label={t('mobile.bets.potentialWinnings')} value={formatFcfa(returnAmount)} />
            </Box>
          </Stack>
        </Box>

        <Box sx={cardSx}>
          <SectionTitle icon={<ConfirmationNumberOutlinedIcon />} title={t('mobile.bets.details')} />
          <Stack sx={{ px: 1.5, pb: 0.5 }}>
            <DetailRow icon={<CalendarMonthOutlinedIcon />} label={t('mobile.bets.kickoff')} value={matchDisplay.dateTime} />
            <DetailRow icon={<ConfirmationNumberOutlinedIcon />} label={t('mobile.bets.betId')} value={bet.betid || '—'} last />
          </Stack>
        </Box>

        <Box sx={{ ...cardSx, borderColor: `${status.color}55`, background: status.bg }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.5 }}>
            <Box sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', color: status.color, background: `${status.color}1F` }}>
              <EmojiEventsOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={labelSx}>{t('mobile.bets.result')}</Typography>
              <Typography sx={{ ...valueSx, color: status.color }}>{status.label}</Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    )
  }
}

const backButtonSx = { width: 36, height: 36, border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.card, color: colors.text, display: 'grid', placeItems: 'center', cursor: 'pointer', p: 0 }
const cardSx = { border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.card, overflow: 'hidden' }
const labelSx = { color: colors.muted, fontFamily: 'Poppins,sans-serif', fontSize: 11 }
const valueSx = { color: colors.text, fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600 }

function LoadingState() {
  return <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 300, border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.card }}><CircularProgress size={28} sx={{ color: colors.accent }} /><Typography sx={{ ...labelSx, fontSize: 13 }}>Loading bet details…</Typography></Stack>
}

function SectionTitle({ icon, title }) {
  return <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${colors.border}`, color: colors.accent }}><Box sx={{ display: 'grid', placeItems: 'center' }}>{icon}</Box><Typography sx={{ color: colors.text, fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 700 }}>{title}</Typography></Stack>
}

function Team({ name, image, align = 'left' }) {
  return <Stack direction={align === 'right' ? 'row-reverse' : 'row'} spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}><Box sx={{ width: 34, height: 34, flex: '0 0 auto', borderRadius: '50%', overflow: 'hidden', background: '#15243A' }}><Image src={image || Ball} width={34} height={34} alt="" /></Box><Typography sx={{ ...valueSx, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align }}>{name || 'Team'}</Typography></Stack>
}

function Metric({ label, value }) {
  return <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: '8px', p: 1, minWidth: 0 }}><Typography sx={labelSx}>{label}</Typography><Typography sx={{ ...valueSx, fontSize: 12, overflowWrap: 'anywhere' }}>{value}</Typography></Box>
}

function DetailRow({ icon, label, value, last = false }) {
  return <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, py: 1.15, borderBottom: last ? 0 : `1px solid ${colors.border}` }}><Box sx={{ color: colors.accent, display: 'grid', placeItems: 'center' }}>{icon}</Box><Typography sx={{ ...labelSx, flex: 1 }}>{label}</Typography><Typography sx={{ ...valueSx, maxWidth: '55%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography></Stack>
}

function StatusPill({ status }) {
  return <Typography component="span" sx={{ color: status.color, background: status.bg, border: `1px solid ${status.color}40`, borderRadius: '999px', px: 1, py: 0.4, fontFamily: 'Poppins,sans-serif', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{status.label}</Typography>
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
