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
    color: '#32D7FF',
    bg: 'rgba(50, 215, 255, 0.12)',
    border: 'rgba(50, 215, 255, 0.28)',
  },
  withdraw: {
    icon: 'solar:card-transfer-bold',
    color: '#FF9E7A',
    bg: 'rgba(255, 158, 122, 0.12)',
    border: 'rgba(255, 158, 122, 0.28)',
  },
}

const statusMeta = {
  success: {
    labelKey: 'status.success',
    color: '#35E0A1',
    bg: 'rgba(53, 224, 161, 0.12)',
    border: 'rgba(53, 224, 161, 0.28)',
  },
  failed: {
    labelKey: 'status.failed',
    color: '#FF8CA0',
    bg: 'rgba(255, 140, 160, 0.12)',
    border: 'rgba(255, 140, 160, 0.28)',
  },
  processing: {
    labelKey: 'status.processing',
    color: '#C7A6FF',
    bg: 'rgba(199, 166, 255, 0.12)',
    border: 'rgba(199, 166, 255, 0.28)',
  },
  pending: {
    labelKey: 'status.pending',
    color: '#F8C14A',
    bg: 'rgba(248, 193, 74, 0.12)',
    border: 'rgba(248, 193, 74, 0.28)',
  },
}

const emptySummary = {
  totalDepositsUsdt: 0,
  totalWithdrawalsUsdt: 0,
  count: 0,
}

function toNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

function formatNumber(value, currency, locale = 'en') {
  const numericValue = toNumber(value)
  const isFcfa = String(currency || '').toUpperCase() === 'FCFA'

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: isFcfa ? 0 : 2,
  }).format(numericValue)
}

function formatAmount(amount, t, locale) {
  if (!amount || amount.value === null || amount.value === undefined) return t('common.notAvailable')

  const currency = String(amount.currency || 'FCFA').toUpperCase()
  const formatted = formatNumber(amount.value, currency, locale)
  const label = currency === 'FCFA' ? `${formatted} FCFA` : `${currency} ${formatted}`

  return amount.approximate ? `~ ${label}` : label
}

function formatUsdt(value, locale) {
  return `${formatNumber(value, 'FCFA', locale)} FCFA`
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
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(6, 16, 31, 0.68)',
        padding: '12px',
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color }}>
        <Icon icon={icon} width="18" height="18" />
        <Typography sx={{ color: '#8EA4C2', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px' }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          color: '#FFFFFF',
          fontFamily: 'Inter, Poppins, sans-serif',
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
        borderRadius: '8px',
        border: `1px solid ${type.border}`,
        background: '#10284D',
        padding: '12px',
        boxShadow: '0 14px 30px rgba(0, 0, 0, 0.22)',
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
            borderRadius: '8px',
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
                  color: '#FFFFFF',
                  fontFamily: 'Inter, Poppins, sans-serif',
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
                  color: '#8EA4C2',
                  fontFamily: 'Inter, Poppins, sans-serif',
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
                <Typography sx={{ fontFamily: 'Inter, Poppins, sans-serif', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>
                  {translatedStatus(item, status, t)}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Stack spacing={0.25}>
            <Typography sx={{ color: '#8EA4C2', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '11px' }}>
              {translatedAmountLabel(item.primaryAmount, t)}
            </Typography>
            <Typography
              sx={{
                color: '#FFFFFF',
                fontFamily: 'Inter, Poppins, sans-serif',
                fontSize: '18px',
                fontWeight: 800,
                lineHeight: 1.2,
                overflowWrap: 'anywhere',
              }}
            >
              {formatAmount(item.primaryAmount, t, locale)}
            </Typography>
            {secondary ? (
              <Typography sx={{ color: '#DDE7F5', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px', overflowWrap: 'anywhere' }}>
                {translatedAmountLabel(item.secondaryAmount, t)}: {secondary}
              </Typography>
            ) : null}
            {item.conversionNote ? (
              <Typography sx={{ color: '#F8C14A', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px', overflowWrap: 'anywhere' }}>
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '10px',
          gap: 1,
        }}
      >
        <Typography
          sx={{
            color: '#8EA4C2',
            fontFamily: 'Inter, Poppins, sans-serif',
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
            color: '#8EA4C2',
            fontFamily: 'Inter, Poppins, sans-serif',
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
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(16, 40, 77, 0.62)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <Icon icon="solar:bill-list-bold" width="38" height="38" style={{ color: '#8EA4C2' }} />
      <Typography sx={{ color: '#FFFFFF', fontFamily: 'Inter, Poppins, sans-serif', fontWeight: 800 }}>
        {t('emptyStates.noTransactions')}
      </Typography>
      <Typography sx={{ color: '#8EA4C2', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '13px', lineHeight: 1.45 }}>
        {copy}
      </Typography>
    </Stack>
  )
}

export default function TransactionHistory() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'
  const [selected, setSelected] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

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

        const response = await authFetch('/api/my-transactions?type=all')
        const result = await response.json().catch(() => ({}))

        if (response.status === 401 || response.status === 404) {
          router.push('/login')
          return
        }

        if (!response.ok) {
          throw new Error(result.message || t('messages.unableLoadTransactions'))
        }

        if (!active) return

        setTransactions(Array.isArray(result.transactions) ? result.transactions : Array.isArray(result.data) ? result.data : [])
        setSummary(result.summary || emptySummary)
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

  return (
    <Cover>
      <Head>
        <title>{t('mobile.transactions.title')}</title>
        <meta name="description" content={t('mobile.transactions.metaDescription')} />
        <link rel="icon" href="/european.ico" />
      </Head>

      <Box sx={{ width: '100%', minHeight: '80vh', color: '#E9E5DA', paddingBottom: '20px' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', padding: '4px 0 12px' }}>
          <Stack
            component="button"
            type="button"
            aria-label={t('common.back')}
            onClick={() => router.back()}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: 0,
              borderRadius: '8px',
              background: 'rgba(233, 229, 218, 0.08)',
              color: '#E9E5DA',
              cursor: 'pointer',
            }}
          >
            <Icon icon="material-symbols:arrow-back-ios-new-rounded" width="20" height="20" />
          </Stack>
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#E9E5DA' }}>
            {t('mobile.transactions.title')}
          </Typography>
        </Stack>

        <Stack
          spacing={1.25}
          sx={{
            borderRadius: '8px',
            border: '1px solid rgba(27, 182, 255, 0.24)',
            background: '#10284D',
            padding: '14px',
            marginBottom: '12px',
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: '#FFFFFF', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '18px', fontWeight: 800 }}>
                {t('mobile.transactions.paymentHistory')}
              </Typography>
              <Typography sx={{ color: '#8EA4C2', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px' }}>
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
                borderRadius: '8px',
                color: '#1BB6FF',
                background: 'rgba(27, 182, 255, 0.12)',
              }}
            >
              <Icon icon="solar:history-bold" width="22" height="22" />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <SummaryStat
              label={t('mobile.transactions.totalDeposits')}
              value={formatUsdt(summary.totalDepositsUsdt, locale)}
              icon="solar:wallet-money-bold"
              color="#32D7FF"
            />
            <SummaryStat
              label={t('mobile.transactions.totalWithdrawals')}
              value={formatUsdt(summary.totalWithdrawalsUsdt, locale)}
              icon="solar:card-transfer-bold"
              color="#FF9E7A"
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
                  border: `1px solid ${active ? 'rgba(27, 182, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '8px',
                  background: active ? '#1BB6FF' : '#10284D',
                  color: active ? '#06101F' : '#E9E5DA',
                  padding: '8px 10px',
                  cursor: 'pointer',
                }}
              >
                <Icon icon={tab.icon} width="17" height="17" />
                <Typography sx={{ fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {t(tab.labelKey)}
                </Typography>
                <Typography sx={{ fontFamily: 'Inter, Poppins, sans-serif', fontSize: '11px', fontWeight: 800, opacity: 0.72 }}>
                  {countFor(transactions, tab.key)}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        {loading ? (
          <Stack spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
            <CircularProgress size={28} sx={{ color: '#1BB6FF' }} />
            <Typography sx={{ color: '#8EA4C2', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '13px' }}>
              {t('mobile.transactions.loading')}
            </Typography>
          </Stack>
        ) : error ? (
          <Stack
            spacing={1.25}
            sx={{
              borderRadius: '8px',
              border: '1px solid rgba(255, 158, 122, 0.28)',
              background: 'rgba(255, 158, 122, 0.08)',
              padding: '16px',
            }}
          >
            <Typography sx={{ color: '#FFFFFF', fontFamily: 'Inter, Poppins, sans-serif', fontWeight: 800 }}>
              {t('mobile.transactions.transactionUnavailable')}
            </Typography>
            <Typography sx={{ color: '#FFC9B8', fontFamily: 'Inter, Poppins, sans-serif', fontSize: '13px' }}>
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
                borderRadius: '8px',
                background: '#1BB6FF',
                color: '#06101F',
                padding: '9px 12px',
                cursor: 'pointer',
              }}
            >
              <Icon icon="solar:refresh-bold" width="16" height="16" />
              <Typography sx={{ fontFamily: 'Inter, Poppins, sans-serif', fontSize: '12px', fontWeight: 800 }}>
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
