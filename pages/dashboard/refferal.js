import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import Cover from './cover'
import Rd from '@/public/icon/rounds.png'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'

const FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Level 1', label: 'Level 1' },
  { key: 'Level 2', label: 'Level 2' },
  { key: 'Level 3', label: 'Level 3' },
]

function money(value) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

function formatJoinedAt(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function countByLevel(referrals, label) {
  return referrals.filter((item) => item.levelLabel === label).length
}

export default function Refferal() {
  const router = useRouter()
  const mountedRef = useRef(false)
  const [referCode, setReferCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReferrals = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true)
      setError('')
    }

    const session = await requireSession(router)
    if (!session) {
      if (mountedRef.current) setLoading(false)
      return
    }

    clearLegacyAuthStorage()

    try {
      const response = await authFetch('/api/my-referrals')
      const result = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 404) {
        router.push('/signin')
        return
      }

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Unable to load referrals.')
      }

      if (!mountedRef.current) return
      setReferCode(result.refer || '')
      setReferrals(Array.isArray(result.referrals) ? result.referrals : [])
    } catch (err) {
      console.error(err)
      if (mountedRef.current) {
        setError(err.message || 'Unable to load referrals.')
        setReferrals([])
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    mountedRef.current = true
    loadReferrals()

    return () => {
      mountedRef.current = false
    }
  }, [loadReferrals])

  const visibleReferrals = useMemo(() => {
    if (filter === 'All') return referrals
    return referrals.filter((item) => item.levelLabel === filter)
  }, [filter, referrals])

  const totalDeposit = useMemo(
    () => referrals.reduce((sum, item) => sum + Number(item.totald || 0), 0),
    [referrals]
  )

  const activeCount = useMemo(
    () => referrals.filter((item) => Boolean(item.firstd)).length,
    [referrals]
  )

  const filteredDeposit = useMemo(
    () => visibleReferrals.reduce((sum, item) => sum + Number(item.totald || 0), 0),
    [visibleReferrals]
  )

  const hasReferrals = referrals.length > 0

  return (
    <Cover>
      <Head>
        <title>Referral Details</title>
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box sx={{ minHeight: '85vh', width: '100%', overflowX: 'hidden', color: '#E9E5DA' }}>
        <Stack spacing={2} sx={{ width: '100%', pb: '64px' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', py: 1 }}>
            <KeyboardArrowLeftOutlinedIcon
              sx={{ width: 26, height: 26, color: '#E9E5DA', cursor: 'pointer' }}
              onClick={() => router.push('/dashboard/account')}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 18, fontFamily: 'Poppins,sans-serif', fontWeight: 600 }}>
                Referrals
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
                Invite code: {referCode || 'Loading...'}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              border: '1px solid rgba(27, 182, 255, 0.22)',
              bgcolor: 'rgba(9, 24, 42, 0.92)',
              borderRadius: '8px',
              p: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <SummaryStat label="Total" value={referrals.length} />
              <SummaryStat label="Active" value={activeCount} />
              <SummaryStat label="Deposits" value={`${money(totalDeposit)} USDT`} />
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              width: '100%',
              overflowX: 'auto',
              pb: 0.25,
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {FILTERS.map((item) => {
              const selected = filter === item.key
              const count = item.key === 'All' ? referrals.length : countByLevel(referrals, item.key)

              return (
                <Button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  sx={{
                    minWidth: '86px',
                    height: 36,
                    px: 1.25,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Poppins,sans-serif',
                    color: selected ? '#06101F' : '#B9CEE2',
                    bgcolor: selected ? '#1BB6FF' : 'rgba(233, 229, 218, 0.06)',
                    border: selected ? '1px solid #1BB6FF' : '1px solid rgba(233, 229, 218, 0.1)',
                    '&:hover': {
                      bgcolor: selected ? '#35C0FF' : 'rgba(233, 229, 218, 0.1)',
                    },
                  }}
                >
                  {item.label} ({count})
                </Button>
              )
            })}
          </Stack>

          <Box
            sx={{
              border: '1px solid rgba(233, 229, 218, 0.1)',
              bgcolor: 'rgba(233, 229, 218, 0.04)',
              borderRadius: '8px',
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography sx={{ fontSize: 13, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
                Showing {visibleReferrals.length} referral{visibleReferrals.length === 1 ? '' : 's'}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#E9E5DA', fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>
                {money(filteredDeposit)} USDT
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: 'rgba(27, 182, 255, 0.22)' }} />

          {loading ? (
            <StatePanel>
              <CircularProgress size={28} sx={{ color: '#1BB6FF' }} />
              <Typography sx={{ mt: 1.5, fontSize: 14, color: '#B9CEE2', fontFamily: 'Poppins,sans-serif' }}>
                Loading referrals...
              </Typography>
            </StatePanel>
          ) : error ? (
            <StatePanel>
              <Typography sx={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>
                Referrals could not load
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
                {error}
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadReferrals}
                sx={{
                  mt: 1.5,
                  color: '#06101F',
                  bgcolor: '#1BB6FF',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#35C0FF' },
                }}
              >
                Retry
              </Button>
            </StatePanel>
          ) : !hasReferrals ? (
            <StatePanel>
              <Typography sx={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>
                No referrals yet
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
                Share your invite code and new referrals will appear here.
              </Typography>
            </StatePanel>
          ) : visibleReferrals.length === 0 ? (
            <StatePanel>
              <Typography sx={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins,sans-serif' }}>
                No {filter.toLowerCase()} referrals
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
                Try another level to view the rest of your referral network.
              </Typography>
            </StatePanel>
          ) : (
            <Stack spacing={1}>
              {visibleReferrals.map((item) => (
                <ReferralRow item={item} key={`${item.level}-${item.key || item.id || item.username}`} />
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Cover>
  )
}

function SummaryStat({ label, value }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, color: '#8EA4B8', fontFamily: 'Poppins,sans-serif' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.25,
          color: '#E9E5DA',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'Poppins,sans-serif',
          lineHeight: 1.25,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function StatePanel({ children }) {
  return (
    <Box
      sx={{
        minHeight: 180,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        border: '1px solid rgba(233, 229, 218, 0.1)',
        bgcolor: 'rgba(233, 229, 218, 0.04)',
        borderRadius: '8px',
        px: 2,
        py: 4,
      }}
    >
      <Box>{children}</Box>
    </Box>
  )
}

function ReferralRow({ item }) {
  const tone =
    item.level === 1
      ? { color: '#06101F', bg: '#9BE15D' }
      : item.level === 2
        ? { color: '#06101F', bg: '#87D8FF' }
        : { color: '#06101F', bg: '#F6C56F' }

  return (
    <Box
      sx={{
        border: '1px solid rgba(233, 229, 218, 0.1)',
        bgcolor: 'rgba(6, 16, 31, 0.86)',
        borderRadius: '8px',
        px: 1.25,
        py: 1,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Image src={Rd} width={40} height={40} alt="" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: '#E9E5DA',
                fontFamily: 'Poppins,sans-serif',
                fontSize: 15,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {item.username || 'Unknown user'}
            </Typography>
            <Box
              component="span"
              sx={{
                flex: '0 0 auto',
                px: 0.75,
                py: 0.2,
                borderRadius: '6px',
                bgcolor: tone.bg,
                color: tone.color,
                fontSize: 10,
                fontWeight: 800,
                fontFamily: 'Poppins,sans-serif',
              }}
            >
              {item.levelLabel || `Level ${item.level || 1}`}
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
            <Typography sx={{ color: '#8EA4B8', fontFamily: 'Poppins,sans-serif', fontSize: 12 }}>
              {formatJoinedAt(item.joinedAt || item.created_at || item.crdate)}
            </Typography>
            <Typography
              sx={{
                color: item.firstd ? '#9BE15D' : '#8EA4B8',
                fontFamily: 'Poppins,sans-serif',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {item.firstd ? 'Active' : 'Pending'}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ flex: '0 0 auto', textAlign: 'right' }}>
          <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 800 }}>
            {money(item.totald)}
          </Typography>
          <Typography sx={{ color: '#8EA4B8', fontFamily: 'Poppins,sans-serif', fontSize: 11 }}>
            USDT
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
