import PaginationButton from '@/components/PaginationButton'
import { translateApiMessage } from '@/lib/translateApiMessage'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Cover from './cover'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { useTranslation } from 'next-i18next'

const tabs = [
  { key: 'all', labelKey: 'common.all', icon: 'solar:bill-list-bold' },
  { key: 'deposit', labelKey: 'mobile.transactions.deposits', icon: 'solar:wallet-money-bold' },
  { key: 'withdraw', labelKey: 'mobile.transactions.withdrawals', icon: 'solar:card-transfer-bold' },
]

const typeMeta = {
  deposit: {
    icon: 'solar:wallet-money-bold',
    color: 'var(--ucl-blue-accent)',
    bg: 'rgba(50, 215, 255, 0.12)',
    border: 'rgba(50, 215, 255, 0.28)',
  },
  withdraw: {
    icon: 'solar:card-transfer-bold',
    color: 'var(--ucl-error)',
    bg: 'rgba(255, 158, 122, 0.12)',
    border: 'rgba(255, 158, 122, 0.28)',
  },
}

const statusMeta = {
  success: {
    labelKey: 'status.success',
    color: 'var(--ucl-success)',
    bg: 'rgba(53, 224, 161, 0.12)',
    border: 'rgba(53, 224, 161, 0.28)',
  },
  failed: {
    labelKey: 'status.failed',
    color: 'var(--ucl-error)',
    bg: 'rgba(255, 140, 160, 0.12)',
    border: 'rgba(255, 140, 160, 0.28)',
  },
  processing: {
    labelKey: 'status.processing',
    color: '#c9b8ff',
    bg: 'rgba(199, 166, 255, 0.12)',
    border: 'rgba(199, 166, 255, 0.28)',
  },
  pending: {
    labelKey: 'status.pending',
    color: 'var(--ucl-warning)',
    bg: 'rgba(248, 193, 74, 0.12)',
    border: 'rgba(248, 193, 74, 0.28)',
  },
}

const emptySummary = {
  totalDepositsMmk: 0,
  totalWithdrawalsMmk: 0,
  count: 0,
}

function toNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

function formatNumber(value, currency, locale = 'en') {
  const numericValue = toNumber(value)
  const isUsdt = ['USDT', 'MMK'].includes(String(currency || '').toUpperCase())

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isUsdt ? 3 : 2,
  }).format(numericValue)
}

function formatAmount(amount, t, locale) {
  if (!amount || amount.value === null || amount.value === undefined) return t('common.notAvailable')

  const currency = String(amount.currency || 'MMK').toUpperCase()
  const formatted = formatNumber(amount.value, currency, locale)
  const label = ['USDT', 'MMK'].includes(currency) ? `${formatted} ${currency}` : `${currency} ${formatted}`

  return amount.approximate ? `~ ${label}` : label
}

function formatMmk(value, locale) {
  return `${formatNumber(value, 'MMK', locale)} MMK`
}

function formatDate(value, locale, t) {
  if (!value) return t('mobile.transactions.noTime')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('mobile.transactions.noTime')

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function metaForType(type) {
  return typeMeta[type] || typeMeta.deposit
}

function metaForStatus(status) {
  return statusMeta[status] || statusMeta.pending
}

function countFor(transactions, key) {
  if (key === 'all') return transactions.length
  return transactions.filter((item) => item.type === key).length
}

function translatedAmountLabel(amount, t) {
  return amount?.labelKey ? t(amount.labelKey) : amount?.label || t('common.amount')
}

function translatedTransactionTitle(item, t) {
  if (item.titleKey) return t(item.titleKey)
  if (item.type === 'deposit') return t('mobile.transactions.titleDeposit')
  if (item.type === 'withdraw') return t('mobile.transactions.titleWithdrawal')
  return item.title || t('common.transaction')
}

function translatedTransactionDetail(item, t) {
  if (Array.isArray(item.detailParts) && item.detailParts.length) {
    return item.detailParts
      .map((part) => `${part.labelKey ? t(part.labelKey) : part.label}: ${part.value}`)
      .join(' / ')
  }

  if (item.detailKey) return t(item.detailKey, item.detailValues || {})
  return item.detail || t('mobile.transactions.transactionRequest')
}

function translatedStatus(item, fallback, t) {
  if (item.statusKey) return t(item.statusKey)
  return item.statusLabel || t(fallback.labelKey || 'status.pending')
}

function SummaryStat({ label, value, icon, color }) {
  return (
    <Stack
      spacing={0.75}
      sx={{
        flex: '1 1 150px',
        minWidth: 0,
        borderRadius: '12px',
        border: '1px solid var(--ucl-border)',
        background: 'var(--ucl-paper)',
        padding: '12px',
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color }}>
        <Icon icon={icon} width="18" height="18" />
        <Typography sx={{ color: 'var(--ucl-muted)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px' }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          color: 'var(--ucl-ink)',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: '18px',
          fontWeight: 800,
          lineHeight: 1.2,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Stack>
  )
}

function TransactionCard({ item, t, locale }) {
  const type = metaForType(item.type)
  const status = metaForStatus(item.status)
  const secondary = item.secondaryAmount ? formatAmount(item.secondaryAmount, t, locale) : ''

  return (
    <Stack
      spacing={1.25}
      sx={{
        width: '100%',
        borderRadius: '12px',
        border: `1px solid ${type.border}`,
        background: 'var(--ucl-paper)',
        padding: '12px',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        <Stack
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            flex: '0 0 42px',
            borderRadius: '12px',
            color: type.color,
            background: type.bg,
          }}
        >
          <Icon icon={type.icon} width="22" height="22" />
        </Stack>

        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: 'var(--ucl-ink)',
                  fontFamily: 'Inter, Arial, sans-serif',
                  fontSize: '15px',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  overflowWrap: 'anywhere',
                }}
              >
                {translatedTransactionTitle(item, t)}
              </Typography>
              <Typography
                sx={{
                  color: 'var(--ucl-muted)',
                  fontFamily: 'Inter, Arial, sans-serif',
                  fontSize: '12px',
                  overflowWrap: 'anywhere',
                }}
              >
                {item.methodLabel || item.methodCode?.toUpperCase() || t('mobile.transactions.paymentMethod')}
              </Typography>
            </Stack>

            {item.hideStatusTag ? null : (
              <Stack
                sx={{
                  flex: '0 0 auto',
                  borderRadius: '999px',
                  border: `1px solid ${status.border}`,
                  background: status.bg,
                  color: status.color,
                  padding: '5px 9px',
                }}
              >
                <Typography sx={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>
                  {translatedStatus(item, status, t)}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Stack spacing={0.25}>
            <Typography sx={{ color: 'var(--ucl-muted)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px' }}>
              {translatedAmountLabel(item.primaryAmount, t)}
            </Typography>
            <Typography
              sx={{
                color: 'var(--ucl-ink)',
                fontFamily: 'Inter, Arial, sans-serif',
                fontSize: '18px',
                fontWeight: 800,
                lineHeight: 1.2,
                overflowWrap: 'anywhere',
              }}
            >
              {formatAmount(item.primaryAmount, t, locale)}
            </Typography>
            {secondary ? (
              <Typography sx={{ color: '#DDE7F5', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', overflowWrap: 'anywhere' }}>
                {translatedAmountLabel(item.secondaryAmount, t)}: {secondary}
              </Typography>
            ) : null}
            {item.conversionNote ? (
              <Typography sx={{ color: 'var(--ucl-warning)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', overflowWrap: 'anywhere' }}>
                {item.conversionNoteKey ? t(item.conversionNoteKey, item.conversionNoteValues || {}) : item.conversionNote}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #d9e2f2',
          paddingTop: '10px',
          gap: 1,
        }}
      >
        <Typography
          sx={{
            color: 'var(--ucl-muted)',
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {translatedTransactionDetail(item, t)}
        </Typography>
        <Typography
          sx={{
            flex: '0 0 auto',
            color: 'var(--ucl-muted)',
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}
        >
          {formatDate(item.timestamp, locale, t)}
        </Typography>
      </Stack>
    </Stack>
  )
}

function EmptyState({ selected, t }) {
  const copy = selected === 'all'
    ? t('mobile.transactions.emptyAll')
    : t('mobile.transactions.emptyFiltered', { type: selected === 'deposit' ? t('common.deposit').toLowerCase() : t('common.withdraw').toLowerCase() })

  return (
    <Stack
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
        borderRadius: '12px',
        border: '1px solid var(--ucl-border)',
        background: 'var(--ucl-panel)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <Icon icon="solar:bill-list-bold" width="38" height="38" style={{ color: 'var(--ucl-muted)' }} />
      <Typography sx={{ color: 'var(--ucl-ink)', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 800 }}>
        {t('emptyStates.noTransactions')}
      </Typography>
      <Typography sx={{ color: 'var(--ucl-muted)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', lineHeight: 1.45 }}>
        {copy}
      </Typography>
    </Stack>
  )
}

export default function TransactionHistory() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'my'
  const [selected, setSelected] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const filteredTransactions = useMemo(() => (
    selected === 'all'
      ? transactions
      : transactions.filter((item) => item.type === selected)
  ), [selected, transactions])

  useEffect(() => {
    let active = true

    async function loadTransactions() {
      const session = await requireSession(router)
      if (!session) return
      clearLegacyAuthStorage()

      try {
        setLoading(true)
        setError('')

        const response = await authFetch('/api/my-transactions?type=all&page=1', { fresh: reloadKey > 0 })
        const result = await response.json().catch(() => ({}))

        if (response.status === 401 || response.status === 404) {
          router.push('/login')
          return
        }

        if (!response.ok) {
          throw new Error(translateApiMessage(result, t, 'messages.unableLoadTransactions'))
        }

        if (!active) return

        setTransactions(Array.isArray(result.transactions) ? result.transactions : Array.isArray(result.data) ? result.data : [])
        setSummary(result.summary || emptySummary)
        setNextCursor(result.nextCursor)
      } catch (err) {
        if (active) setError(err.message || t('messages.unableLoadTransactions'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTransactions()

    return () => {
      active = false
    }
  }, [router, reloadKey, t])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const response = await authFetch(`/api/my-transactions?type=all&page=1&cursor=${encodeURIComponent(nextCursor)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(t('messages.unableLoadTransactions'))
      setTransactions(current => [...current, ...(result.transactions || [])])
      setNextCursor(result.nextCursor)
    } catch (err) { setError(err.message) }
    finally { setLoadingMore(false) }
  }

  return (
    <Cover>
      <Head>
        <title>{t('mobile.transactions.title')}</title>
        <meta name="description" content={t('mobile.transactions.metaDescription')} />
        <link rel="icon" href="/european.ico" />
      </Head>

      <Box sx={{ width: '100%', minHeight: '80vh', color: 'var(--ucl-ink)', paddingBottom: '20px' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', padding: '4px 0 12px' }}>
          <Stack
            component="button"
            type="button"
            aria-label={t('common.back')}
            onClick={() => router.back()}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              border: 0,
              borderRadius: '12px',
              background: 'var(--ucl-panel)',
              color: 'var(--ucl-ink)',
              cursor: 'pointer',
            }}
          >
            <Icon icon="material-symbols:arrow-back-ios-new-rounded" width="20" height="20" />
          </Stack>
          <Typography component="h1" sx={{ fontSize: { xs: '32px', sm: '48px' }, fontFamily: 'Georgia,serif', fontWeight: 400, color: 'var(--ucl-ink)' }}>
            {t('mobile.transactions.title')}
          </Typography>
        </Stack>

        <Stack
          spacing={1.25}
          sx={{
            borderRadius: '12px',
            border: '1px solid rgba(27, 182, 255, 0.24)',
            background: 'var(--ucl-paper)',
            padding: '14px',
            marginBottom: '12px',
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: 'var(--ucl-ink)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '18px', fontWeight: 800 }}>
                {t('mobile.transactions.paymentHistory')}
              </Typography>
              <Typography sx={{ color: 'var(--ucl-muted)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px' }}>
                {t('mobile.transactions.count', { count: transactions.length })}
              </Typography>
            </Stack>
            <Stack
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                flex: '0 0 40px',
                borderRadius: '12px',
                color: 'var(--ucl-blue-accent)',
                background: 'rgba(27, 182, 255, 0.12)',
              }}
            >
              <Icon icon="solar:history-bold" width="22" height="22" />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <SummaryStat
              label={t('mobile.transactions.totalDeposits')}
              value={formatMmk(summary.totalDepositsMmk, locale)}
              icon="solar:wallet-money-bold"
              color="#00409e"
            />
            <SummaryStat
              label={t('mobile.transactions.totalWithdrawals')}
              value={formatMmk(summary.totalWithdrawalsMmk, locale)}
              icon="solar:card-transfer-bold"
              color="#a43d4a"
            />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ width: '100%', overflowX: 'auto', paddingBottom: '12px' }}>
          {tabs.map((tab) => {
            const active = selected === tab.key
            return (
              <Stack
                key={tab.key}
                component="button"
                type="button"
                onClick={() => setSelected(tab.key)}
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1 0 116px',
                  minHeight: 42,
                  border: `1px solid ${active ? 'rgba(27, 182, 255, 0.5)' : 'var(--ucl-border)'}`,
                  borderRadius: '12px',
                  background: active ? '#00409e' : 'var(--ucl-paper)',
                  color: active ? '#f5f7fc' : 'var(--ucl-ink)',
                  padding: '8px 10px',
                  cursor: 'pointer',
                }}
              >
                <Icon icon={tab.icon} width="17" height="17" />
                <Typography sx={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {t(tab.labelKey)}
                </Typography>
                <Typography sx={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', fontWeight: 800, opacity: 0.72 }}>
                  {countFor(transactions, tab.key)}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        {loading ? (
          <Stack spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
            <CircularProgress size={28} sx={{ color: 'var(--ucl-blue-accent)' }} />
            <Typography sx={{ color: 'var(--ucl-muted)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px' }}>
              {t('mobile.transactions.loading')}
            </Typography>
          </Stack>
        ) : error ? (
          <Stack
            spacing={1.25}
            sx={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 158, 122, 0.28)',
              background: 'rgba(255, 158, 122, 0.08)',
              padding: '16px',
            }}
          >
            <Typography sx={{ color: 'var(--ucl-ink)', fontFamily: 'Inter, Arial, sans-serif', fontWeight: 800 }}>
              {t('mobile.transactions.transactionUnavailable')}
            </Typography>
            <Typography sx={{ color: 'var(--ucl-error)', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px' }}>
              {error}
            </Typography>
            <Stack
              component="button"
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'flex-start',
                border: 0,
                borderRadius: '12px',
                background: '#00409e',
                color: 'var(--ucl-ink)',
                padding: '9px 12px',
                cursor: 'pointer',
              }}
            >
              <Icon icon="solar:refresh-bold" width="16" height="16" />
              <Typography sx={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', fontWeight: 800 }}>
                {t('mobile.transactions.retry')}
              </Typography>
            </Stack>
          </Stack>
        ) : filteredTransactions.length ? (
          <Stack spacing={1.25}>
            {filteredTransactions.map((item) => (
              <TransactionCard key={item.id} item={item} t={t} locale={locale} />
            ))}
          </Stack>
        ) : (
          <EmptyState selected={selected} t={t} />
        )}
        <PaginationButton cursor={nextCursor} loading={loadingMore} onClick={loadMore} />
      </Box>
    </Cover>
  )
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale, ['website', 'mobile', 'forms', 'messages', 'status', 'emptyStates'])
  return {
    props: {
      ...i18nProps,
    },
  }
}
