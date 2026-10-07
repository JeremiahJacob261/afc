import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { useTranslation } from 'next-i18next'

const categoryMeta = {
  bonus: {
    icon: 'solar:gift-bold',
    color: '#286746',
    bg: 'rgba(53, 224, 161, 0.12)',
    border: 'rgba(53, 224, 161, 0.28)',
  },
  bet: {
    icon: 'solar:football-bold',
    color: '#8a6013',
    bg: 'rgba(248, 193, 74, 0.12)',
    border: 'rgba(248, 193, 74, 0.28)',
  },
  broadcast: {
    icon: 'solar:bell-bing-bold',
    color: '#31588f',
    bg: 'rgba(140, 203, 255, 0.12)',
    border: 'rgba(140, 203, 255, 0.28)',
  },
  admin: {
    icon: 'solar:shield-check-bold',
    color: '#594596',
    bg: 'rgba(199, 166, 255, 0.12)',
    border: 'rgba(199, 166, 255, 0.28)',
  },
  deposit: {
    icon: 'solar:wallet-money-bold',
    color: '#0649ff',
    bg: 'rgba(50, 215, 255, 0.12)',
    border: 'rgba(50, 215, 255, 0.28)',
  },
  withdrawal: {
    icon: 'solar:card-transfer-bold',
    color: '#a43d4a',
    bg: 'rgba(255, 158, 122, 0.12)',
    border: 'rgba(255, 158, 122, 0.28)',
  },
}

function metaFor(category) {
  return categoryMeta[category] || categoryMeta.broadcast
}

function formatDate(value, locale, t) {
  if (!value) return t('common.justNow')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('common.justNow')

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeNotification(item, fallbackTitle) {
  return {
    id: item.id || `${item.timestamp || item.time}-${item.message}`,
    title: item.title || fallbackTitle,
    titleKey: item.titleKey || '',
    message: item.message || '',
    messageKey: item.messageKey || '',
    messageValues: item.messageValues || {},
    category: item.category || 'broadcast',
    timestamp: item.timestamp || item.time || null,
  }
}

function resolveMessageValues(values, t) {
  return Object.entries(values || {}).reduce((acc, [key, value]) => {
    if (key === 'typeKey' && typeof value === 'string') {
      acc.typeLabel = t(value).toLowerCase()
      return acc
    }

    if (key === 'statusKey' && typeof value === 'string') {
      acc.status = t(value).toLowerCase()
      return acc
    }

    if (key.endsWith('Key') && typeof value === 'string') {
      acc[key.slice(0, -3)] = t(value)
      return acc
    }

    acc[key] = value
    return acc
  }, {})
}

function NotificationCard({ item, t, locale }) {
  const meta = metaFor(item.category)
  const messageValues = resolveMessageValues(item.messageValues, t)
  const title = item.titleKey ? t(item.titleKey) : item.title
  const message = item.messageKey ? t(item.messageKey, messageValues) : item.message

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        width: '100%',
        minHeight: 96,
        borderRadius: '12px',
        border: `1px solid ${meta.border}`,
        background: '#ffffff',
        padding: '12px',
        boxShadow: 'none',
      }}
    >
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 42,
          flex: '0 0 42px',
          borderRadius: '12px',
          color: meta.color,
          background: meta.bg,
        }}
      >
        <Icon icon={meta.icon} width="22" height="22" />
      </Stack>

      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography
            sx={{
              color: '#080f32',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: '#52685d',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: '11px',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              paddingTop: '2px',
            }}
          >
            {formatDate(item.timestamp, locale, t)}
          </Typography>
        </Stack>
        <Typography
          sx={{
            color: '#DDE7F5',
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '13px',
            fontWeight: 400,
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          {message}
        </Typography>
      </Stack>
    </Stack>
  )
}

function EmptyState({ t }) {
  return (
    <Stack
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 340,
        borderRadius: '12px',
        border: '1px solid #dfe5df',
        background: '#f1f3ee',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <Icon icon="solar:bell-off-bold" width="38" height="38" style={{ color: '#52685d' }} />
      <Typography sx={{ color: '#080f32', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 700 }}>
        {t('emptyStates.noNotifications')}
      </Typography>
      <Typography sx={{ color: '#52685d', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px' }}>
        {t('emptyStates.notificationsComing')}
      </Typography>
    </Stack>
  )
}

export default function Notification() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      const session = await requireSession(router)
      if (!session) return
      clearLegacyAuthStorage()

      try {
        setError('')
        const response = await authFetch('/api/notify')

        if (response.status === 401 || response.status === 404) {
          router.push('/login')
          return
        }

        if (!response.ok) {
          throw new Error(t('messages.unableLoadNotifications'))
        }

        const result = await response.json()
        if (!active) return

        setNotifications(Array.isArray(result) ? result.map((item) => normalizeNotification(item, t('mobile.notifications.fallbackTitle'))) : [])
      } catch (err) {
        if (active) setError(err.message || t('messages.unableLoadNotifications'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [router, t])

  return (
    <Cover>
      <Head>
        <title>{t('mobile.notifications.title')}</title>
        <link rel="icon" href="/european.ico" />
      </Head>

      <Box sx={{ width: '100%', minHeight: '80vh', color: '#080f32' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', padding: '4px 0 12px' }}>
          <KeyboardArrowLeftOutlinedIcon
            sx={{ width: '24px', height: '24px', color: '#080f32', cursor: 'pointer' }}
            onClick={() => router.push('/user')}
          />
          <Typography component="h1" sx={{ fontSize: { xs: '32px', sm: '48px' }, fontFamily: 'Georgia,serif', fontWeight: 400, color: '#080f32' }}>
            {t('mobile.notifications.title')}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '12px',
            border: '1px solid rgba(27, 182, 255, 0.24)',
            background: '#ffffff',
            padding: '14px',
            marginBottom: '12px',
          }}
        >
          <Stack spacing={0.25}>
            <Typography sx={{ color: '#080f32', fontFamily: 'Inter, Arial, sans-serif', fontSize: '18px', fontWeight: 800 }}>
              {t('mobile.notifications.title')}
            </Typography>
            <Typography sx={{ color: '#52685d', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px' }}>
              {t('mobile.notifications.count', { count: notifications.length })}
            </Typography>
          </Stack>
          <Stack
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '12px',
              color: '#0649ff',
              background: 'rgba(27, 182, 255, 0.12)',
            }}
          >
            <Icon icon="solar:bell-bold" width="22" height="22" />
          </Stack>
        </Stack>

        {loading ? (
          <Stack spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
            <CircularProgress size={28} sx={{ color: '#0649ff' }} />
            <Typography sx={{ color: '#52685d', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px' }}>
              {t('mobile.notifications.loading')}
            </Typography>
          </Stack>
        ) : error ? (
          <Stack
            spacing={1}
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 158, 122, 0.28)',
              background: 'rgba(255, 158, 122, 0.08)',
              padding: '16px',
            }}
          >
            <Typography sx={{ color: '#080f32', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 700 }}>
              {t('messages.unableLoadNotifications')}
            </Typography>
            <Typography sx={{ color: '#a43d4a', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px' }}>
              {error}
            </Typography>
          </Stack>
        ) : notifications.length ? (
          <Stack spacing={1.25} sx={{ paddingBottom: '20px' }}>
            {notifications.map((item) => (
              <NotificationCard key={item.id} item={item} t={t} locale={locale} />
            ))}
          </Stack>
        ) : (
          <EmptyState t={t} />
        )}
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
