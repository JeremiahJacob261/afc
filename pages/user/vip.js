import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import {
  AutoAwesome,
  CheckCircleRounded,
  Diamond,
  Groups,
  KeyboardArrowLeftOutlined,
  TrendingUp,
  Wallet,
} from '@mui/icons-material'
import { Box, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material'
import Cover from './cover'
import { supabase } from '@/pages/api/supabase'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { vipDailyRates, vipDepositLimits, vipReferralLimits } from '@/lib/vip'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'

const tierColors = ['#9BE15D', '#56CCF2', '#A78BFA', '#FBBF24', '#FB923C', '#F472B6', '#FDE68A']

function amount(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function ProgressCard({ icon, label, value, detail, color }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 2, color, background: `${color}1f` }}>
            {icon}
          </Box>
          <Typography sx={{ color: '#DDE7F5', fontSize: 13, fontWeight: 600 }}>{label}</Typography>
        </Stack>
        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{percent(value)}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(Math.max(Number(value || 0), 0), 100)}
        sx={{
          mt: 1.5,
          height: 8,
          borderRadius: 99,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': { borderRadius: 99, backgroundColor: color },
        }}
      />
      <Typography sx={{ mt: 1, color: '#8FA4BF', fontSize: 11 }}>{detail}</Typography>
    </Box>
  )
}

export default function Vip() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [vip, setVip] = useState(null)
  const [profile, setProfile] = useState(null)
  const [refCount, setRefCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadVip() {
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

        setProfile(result.profile)
        setRefCount(result.referralCount || 0)
        setVip(result.vip)
      } catch (error) {
        console.error('Unable to load VIP progress', error)
      }
    }

    loadVip()
    return () => { active = false }
  }, [router])

  const level = Number(vip?.viplevel || 1)
  const accent = tierColors[Math.max(0, Math.min(level - 1, tierColors.length - 1))]
  const dailyRate = Number(vip?.dailyRate ?? vipDailyRates[level] ?? 0)
  const levels = useMemo(() => Object.keys(vipDepositLimits).map((key) => Number(key)), [])

  return (
    <Cover>
      <Head>
        <title>{t('mobile.profile.vipProgress')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Stack spacing={2.5} sx={{ pb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            component="button"
            type="button"
            onClick={() => router.push('/user/account')}
            aria-label="Back to account"
            sx={{ display: 'grid', placeItems: 'center', width: 38, height: 38, p: 0, border: 0, borderRadius: 2, color: '#E9E5DA', background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}
          >
            <KeyboardArrowLeftOutlined />
          </Box>
          <Typography sx={{ color: '#E9E5DA', fontSize: 15, fontWeight: 700 }}>VIP rewards</Typography>
        </Stack>

        <Box sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, background: `radial-gradient(circle at 90% 0%, ${accent}45, transparent 36%), linear-gradient(135deg, #142D52 0%, #09182D 100%)`, border: `1px solid ${accent}55`, boxShadow: `0 22px 60px ${accent}1c` }}>
          <Box sx={{ position: 'absolute', top: -60, right: -45, width: 160, height: 160, borderRadius: '50%', border: `1px solid ${accent}35` }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={1}>
              <Chip icon={<AutoAwesome sx={{ color: `${accent} !important` }} />} label="MEMBER BENEFITS" size="small" sx={{ width: 'fit-content', color: accent, background: `${accent}18`, border: `1px solid ${accent}45`, fontWeight: 800, fontSize: 10 }} />
              <Typography sx={{ color: '#fff', fontSize: { xs: 31, sm: 38 }, lineHeight: 1, fontWeight: 900 }}>VIP {level}</Typography>
              <Typography sx={{ maxWidth: 260, color: '#B8C9DE', fontSize: 13, lineHeight: 1.5 }}>Build your team, grow together, and unlock higher daily rewards.</Typography>
            </Stack>
            <Box sx={{ display: 'grid', placeItems: 'center', width: { xs: 66, sm: 82 }, height: { xs: 66, sm: 82 }, flexShrink: 0, borderRadius: '50%', color: accent, background: `${accent}18`, border: `1px solid ${accent}75` }}>
              <Diamond sx={{ fontSize: { xs: 38, sm: 48 } }} />
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.12)' }} />

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Wallet sx={{ color: accent, fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: '#8FA4BF', fontSize: 11 }}>Current balance</Typography>
                <Typography sx={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>{amount(profile?.balance)} FCFA</Typography>
              </Box>
            </Stack>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: '#8FA4BF', fontSize: 11 }}>Daily increase</Typography>
              <Typography sx={{ color: accent, fontSize: 20, fontWeight: 900 }}>{percent(dailyRate * 100)}</Typography>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ mb: 1.25, color: '#fff', fontSize: 17, fontWeight: 800 }}>Your progress</Typography>
          <Stack spacing={1.25}>
            <ProgressCard icon={<Wallet sx={{ fontSize: 18 }} />} label="Total deposits" value={vip?.depositProgress} color="#56CCF2" detail={`${amount(profile?.totald)} of ${amount(vip?.depositLimit)} FCFA`} />
            <ProgressCard icon={<Groups sx={{ fontSize: 18 }} />} label="Active direct downlines" value={vip?.referralProgress} color="#A78BFA" detail={`${refCount} of ${vip?.referralLimit || 0} active members`} />
          </Stack>
        </Box>

        <Box sx={{ p: 2, borderRadius: 3, background: 'rgba(155,225,93,0.08)', border: '1px solid rgba(155,225,93,0.22)' }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <CheckCircleRounded sx={{ color: '#9BE15D', fontSize: 21, mt: 0.15 }} />
            <Box>
              <Typography sx={{ color: '#E9F8D8', fontSize: 13, fontWeight: 800 }}>How to unlock the next tier</Typography>
              <Typography sx={{ mt: 0.5, color: '#AFC69C', fontSize: 12, lineHeight: 1.45 }}>Meet both the deposit requirement and the active direct-downline requirement for a tier.</Typography>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography sx={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>VIP tiers</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingUp sx={{ color: '#9BE15D', fontSize: 17 }} />
              <Typography sx={{ color: '#9BE15D', fontSize: 11, fontWeight: 800 }}>DAILY GROWTH</Typography>
            </Stack>
          </Stack>
          <Stack spacing={1}>
            {levels.map((tier) => {
              const tierColor = tierColors[tier - 1]
              const current = tier === level
              return (
                <Box key={tier} sx={{ p: 1.5, borderRadius: 2.5, background: current ? `${tierColor}18` : 'rgba(255,255,255,0.045)', border: `1px solid ${current ? `${tierColor}70` : 'rgba(255,255,255,0.08)'}` }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 2, color: tierColor, background: `${tierColor}20`, fontWeight: 900, fontSize: 12 }}>V{tier}</Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>VIP {tier}</Typography>
                        {current && <Chip label="CURRENT" size="small" sx={{ height: 18, color: '#06101F', background: tierColor, fontSize: 9, fontWeight: 900 }} />}
                      </Stack>
                      <Typography sx={{ mt: 0.35, color: '#8FA4BF', fontSize: 11 }}>{amount(vipDepositLimits[tier])} FCFA deposit • {vipReferralLimits[tier]} active downlines</Typography>
                    </Box>
                    <Typography sx={{ color: tierColor, fontSize: 14, fontWeight: 900 }}>{percent((vipDailyRates[tier] || 0) * 100)}</Typography>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    </Cover>
  )
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return {
    props: { ...i18nProps },
    revalidate: 3600,
  }
}
