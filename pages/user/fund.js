import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'
import toast, { Toaster } from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import Cover from './cover'
import Loading from '@/pages/components/loading'
import { supabase } from '@/pages/api/supabase'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth'

const brand = {
  bg: '#06101F',
  surface: '#10284D',
  surfaceSoft: '#0B1D3A',
  primary: '#1BB6FF',
  text: '#E9E5DA',
  muted: 'rgba(233, 229, 218, 0.68)',
  danger: '#FFB4AB',
  line: 'rgba(233, 229, 218, 0.14)',
}

const transferOptions = {
  fcfa: [
    { key: 'wave', label: 'Wave', bank: 'Wave' },
    { key: 'mtn', label: 'MTN Money', bank: 'MTN Money' },
  ],
  mmk: [
    { key: 'wave', label: 'Wave', bank: 'Wave' },
    { key: 'kpay', label: 'KPay', bank: 'kpay' },
  ],
  idr: [
    { key: 'DANA', label: 'DANA', bank: 'DANA' },
  ],
}

const steps = ['Method', 'Amount', 'Payment proof']

function normalizeCode(method) {
  return String(method?.currency_code || method?.name || '').toLowerCase()
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function isLocalDestination(destination) {
  const type = normalizeName(destination?.type)
  return type === 'local'
    || type === 'local-transfer'
    || type === 'bank'
    || type === 'mobile-money'
}

function getRate(method) {
  const rate = Number(method?.rates)
  return Number.isFinite(rate) && rate > 0 ? rate : 1
}

function getMinimum(method) {
  return getRate(method) * 5
}

function methodLabel(method) {
  return method?.name || method?.currency_code?.toUpperCase() || 'Deposit method'
}

function formatMoney(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return number.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function findDestination(destinations, method, transferKey) {
  const code = normalizeCode(method)
  if (!code) return null

  const selectedName = normalizeName(method?.name)
  const exactMethodDestination = destinations.find((destination) => (
    selectedName && normalizeName(destination?.name) === selectedName
  ))

  if (exactMethodDestination) return exactMethodDestination

  const matches = destinations.filter((destination) => (
    String(destination?.currency_code || '').toLowerCase() === code
  ))

  if (transferOptions[code]) {
    const option = transferOptions[code].find((item) => item.key === transferKey)
    if (!option) return null
    return matches.find((destination) => (
      String(destination?.bank || '').toLowerCase() === option.bank.toLowerCase()
    )) || null
  }

  if (!matches.length) return null
  return matches[Math.floor(Math.random() * matches.length)]
}

function hasNamedDestination(destinations, method) {
  const selectedName = normalizeName(method?.name)
  if (!selectedName) return false

  return destinations.some((destination) => (
    normalizeName(destination?.name) === selectedName
  ))
}

export default function Funds() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [methods, setMethods] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [transferKey, setTransferKey] = useState('')
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState(null)

  const code = normalizeCode(selectedMethod)
  const requiresTransfer = Boolean(transferOptions[code]) && !hasNamedDestination(destinations, selectedMethod)
  const rate = getRate(selectedMethod)
  const minAmount = selectedMethod ? getMinimum(selectedMethod) : 0
  const numericAmount = Number(amount)
  const amountIsValid = selectedMethod && Number.isFinite(numericAmount) && numericAmount >= minAmount

  const destination = useMemo(
    () => findDestination(destinations, selectedMethod, transferKey),
    [destinations, selectedMethod, transferKey]
  )

  const activeStep = !selectedMethod ? 0 : !amountIsValid ? 1 : 2
  const canSubmit = Boolean(selectedMethod && amountIsValid && destination && file && !submitting)

  useEffect(() => {
    let active = true

    async function loadDepositData() {
      const session = await requireSession(router)
      if (!session) return
      clearLegacyAuthStorage()

      try {
        const [{ data: walletMethods, error: methodsError }, { data: paymentDestinations, error: destinationsError }] = await Promise.all([
          supabase.from('walle').select('*').eq('available', true),
          supabase.from('depositwallet').select('*'),
        ])

        console.log(paymentDestinations);
        if (methodsError) throw methodsError
        if (destinationsError) throw destinationsError
        if (!active) return

        setMethods(Array.isArray(walletMethods) ? walletMethods : [])
        setDestinations(Array.isArray(paymentDestinations) ? paymentDestinations : [])
      } catch (error) {
        console.log(error)
        toast.error('Unable to load deposit methods')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDepositData()
    return () => {
      active = false
    }
  }, [router])

  const selectMethod = (method) => {
    setSelectedMethod(method)
    setTransferKey('')
    setAmount('')
    setFile(null)
  }

  const copyText = async (value, label) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch (error) {
      toast.error('Unable to copy')
    }
  }

  const submitDeposit = async () => {
    if (!selectedMethod) {
      toast.error('Choose a deposit method')
      return
    }

    if (requiresTransfer && !transferKey) {
      toast.error('Choose a transfer option')
      return
    }

    if (!amountIsValid) {
      toast.error(`Minimum deposit is ${formatMoney(minAmount)} ${code.toUpperCase()}`)
      return
    }

    if (!destination) {
      toast.error('No payment address is available for this method')
      return
    }

    if (!file) {
      toast.error('Please upload your payment receipt')
      return
    }

    setSubmitting(true)
    try {
      const fileName = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`
      const receiptPath = `public/${fileName}`
      const { error: uploadError } = await supabase
        .storage
        .from('trcreceipt')
        .upload(receiptPath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('trcreceipt').getPublicUrl(receiptPath)
      const response = await authFetch('/api/create-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          method: code,
          methodName: selectedMethod.name,
          address: data?.publicUrl,
          adminaddress: destination.address,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Unable to create deposit')

      toast.success('Deposit submitted')
      router.push('/user/depositsuccess')
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Deposit submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Cover>
      <Head>
        <title>Deposit - European Football</title>
        <link rel="icon" href="/european.ico" />
      </Head>
      <Loading open={loading || submitting} handleClose={() => {}} />
      <Toaster position="bottom-center" reverseOrder={false} />

      <Stack sx={{ width: '100%', maxWidth: 440, minHeight: '90vh', px: 1.5, pb: '110px', color: brand.text }} spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            aria-label="Go back"
            onClick={() => router.push('/user')}
            sx={{ color: brand.text, bgcolor: 'rgba(233,229,218,0.08)' }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: 0 }}>Deposit</Typography>
            <Typography sx={{ fontSize: 13, color: brand.muted }}>Choose a method, pay, then upload your receipt.</Typography>
          </Box>
        </Stack>

        <Paper elevation={0} sx={{ bgcolor: brand.surfaceSoft, color: brand.text, borderRadius: 2, p: 1.5, border: `1px solid ${brand.line}` }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{
            '& .MuiStepLabel-label': { color: `${brand.muted} !important`, fontSize: 11 },
            '& .Mui-active .MuiStepLabel-label, & .Mui-completed .MuiStepLabel-label': { color: `${brand.text} !important` },
            '& .MuiStepIcon-root': { color: 'rgba(233,229,218,0.22)' },
            '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': { color: brand.primary },
          }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper elevation={0} sx={{ bgcolor: brand.surface, color: brand.text, borderRadius: 2, p: 2, border: `1px solid ${brand.line}` }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Payment method</Typography>
                <Typography sx={{ fontSize: 12, color: brand.muted }}>Available deposit options</Typography>
              </Box>
              <PaymentsRoundedIcon sx={{ color: brand.primary }} />
            </Stack>

            {!loading && methods.length === 0 && (
              <Alert severity="warning" sx={{ bgcolor: '#332A12', color: brand.text }}>
                No deposit methods are available right now. Please contact support.
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
              {methods.map((method) => {
                const methodCode = normalizeCode(method)
                const selected = methodCode === code
                return (
                  <Button
                    key={method.id || method.name}
                    onClick={() => selectMethod(method)}
                    sx={{
                      alignItems: 'stretch',
                      justifyContent: 'flex-start',
                      minHeight: 116,
                      p: 1.25,
                      borderRadius: 2,
                      border: `1px solid ${selected ? brand.primary : brand.line}`,
                      bgcolor: selected ? 'rgba(27,182,255,0.14)' : 'rgba(6,16,31,0.38)',
                      color: brand.text,
                      textAlign: 'left',
                      textTransform: 'none',
                    }}
                  >
                    <Stack spacing={1} sx={{ width: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        {method.image ? (
                          <Box
                            component="img"
                            src={method.image}
                            alt={methodLabel(method)}
                            sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', bgcolor: brand.bg }}
                          />
                        ) : (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: brand.bg, display: 'grid', placeItems: 'center' }}>
                            <PaymentsRoundedIcon sx={{ color: brand.primary }} />
                          </Box>
                        )}
                        {selected && <CheckCircleRoundedIcon sx={{ color: brand.primary, fontSize: 20 }} />}
                      </Stack>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{methodLabel(method)}</Typography>
                        <Typography sx={{ fontSize: 11, color: brand.muted }}>
                          Min {formatMoney(getMinimum(method))} {methodCode.toUpperCase()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                )
              })}
            </Box>

            {requiresTransfer && (
              <Stack spacing={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Transfer option</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {transferOptions[code].map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      clickable
                      onClick={() => setTransferKey(option.key)}
                      sx={{
                        bgcolor: transferKey === option.key ? brand.primary : 'rgba(233,229,218,0.08)',
                        color: transferKey === option.key ? brand.bg : brand.text,
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ bgcolor: brand.surface, color: brand.text, borderRadius: 2, p: 2, border: `1px solid ${brand.line}` }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Amount</Typography>
            <Box
              component="input"
              type="number"
              inputMode="decimal"
              placeholder={selectedMethod ? `Minimum ${formatMoney(minAmount)} ${code.toUpperCase()}` : 'Choose a method first'}
              value={amount}
              disabled={!selectedMethod}
              onChange={(event) => setAmount(event.target.value)}
              sx={{
                width: '100%',
                height: 56,
                border: `1px solid ${amount && !amountIsValid ? brand.danger : brand.line}`,
                borderRadius: 2,
                bgcolor: 'rgba(6,16,31,0.44)',
                color: brand.text,
                px: 1.5,
                fontSize: 16,
                outline: 'none',
                '&::placeholder': { color: brand.muted },
              }}
            />
            {selectedMethod && (
              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, color: brand.muted }}>USDT equivalent</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    {formatMoney(numericAmount / rate)} USDT
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={amountIsValid ? 100 : Math.min(((numericAmount || 0) / minAmount) * 100, 100)}
                  sx={{
                    height: 7,
                    borderRadius: 999,
                    bgcolor: 'rgba(233,229,218,0.12)',
                    '& .MuiLinearProgress-bar': { bgcolor: amountIsValid ? brand.primary : brand.danger },
                  }}
                />
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ bgcolor: brand.surface, color: brand.text, borderRadius: 2, p: 2, border: `1px solid ${brand.line}` }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <PriorityHighRoundedIcon sx={{ color: brand.bg, bgcolor: brand.primary, borderRadius: '50%', p: 0.2 }} />
              <Typography sx={{ fontSize: 13, color: brand.muted }}>
                Send exactly {amountIsValid ? `${formatMoney(numericAmount)} ${code.toUpperCase()}` : 'the entered amount'} to the payment details below.
              </Typography>
            </Stack>

            {!selectedMethod && (
              <Alert severity="info" sx={{ bgcolor: 'rgba(27,182,255,0.12)', color: brand.text }}>
                Choose a deposit method to see payment details.
              </Alert>
            )}

            {selectedMethod && (!amountIsValid || (requiresTransfer && !transferKey)) && (
              <Alert severity="warning" sx={{ bgcolor: '#332A12', color: brand.text }}>
                Enter a valid amount{requiresTransfer ? ' and choose a transfer option' : ''} to continue.
              </Alert>
            )}

            {selectedMethod && amountIsValid && !destination && (
              <Alert severity="error" sx={{ bgcolor: '#3A1717', color: brand.text }}>
                No payment address is available for this method right now. Please contact support.
              </Alert>
            )}

            {destination && amountIsValid && (
              <Stack spacing={1} sx={{ bgcolor: 'rgba(6,16,31,0.38)', borderRadius: 2, p: 1.5 }}>
                <PaymentRow label={isLocalDestination(destination) ? 'Account number' : 'Address'} value={destination.address} onCopy={copyText} />
                {isLocalDestination(destination) && (
                  <>
                    <PaymentRow label="Account name" value={destination.accountname} onCopy={copyText} />
                    <PaymentRow label="Bank" value={destination.bank} onCopy={copyText} />
                  </>
                )}
                {destination.image && (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', mt: 1, bgcolor: brand.bg }}>
                    <Box component="img" src={destination.image} alt="Payment details" sx={{ width: '100%', height: 'auto', display: 'block' }} />
                  </Box>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ bgcolor: brand.surface, color: brand.text, borderRadius: 2, p: 2, border: `1px solid ${brand.line}` }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Receipt upload</Typography>
            <Button
              onClick={() => fileInputRef.current?.click()}
              sx={{
                height: 92,
                borderRadius: 2,
                border: `1.5px dashed ${brand.primary}`,
                color: brand.text,
                bgcolor: 'rgba(27,182,255,0.08)',
                textTransform: 'none',
              }}
            >
              <Stack alignItems="center" spacing={0.5}>
                <UploadFileRoundedIcon sx={{ color: brand.primary }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Browse receipt image</Typography>
                <Typography sx={{ fontSize: 11, color: brand.muted }}>PNG, JPG, or screenshot</Typography>
              </Stack>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ bgcolor: 'rgba(6,16,31,0.38)', borderRadius: 2, p: 1.2, minHeight: 58 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                <InsertDriveFileRoundedIcon sx={{ color: brand.primary }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file?.name || 'No file selected'}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: brand.muted }}>
                    {file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Upload required'}
                  </Typography>
                </Box>
              </Stack>
              {file && (
                <IconButton aria-label="Remove receipt" onClick={() => setFile(null)} sx={{ color: brand.text }}>
                  <DeleteRoundedIcon />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Divider sx={{ borderColor: brand.line }} />

        <Button
          disabled={!canSubmit}
          onClick={submitDeposit}
          sx={{
            minHeight: 54,
            borderRadius: 999,
            bgcolor: brand.primary,
            color: brand.bg,
            fontWeight: 800,
            textTransform: 'none',
            '&:hover': { bgcolor: '#23B5FF' },
            '&.Mui-disabled': { bgcolor: 'rgba(233,229,218,0.12)', color: brand.muted },
          }}
        >
          {submitting ? <CircularProgress size={22} sx={{ color: brand.bg }} /> : 'Submit deposit'}
        </Button>
      </Stack>
    </Cover>
  )
}

function PaymentRow({ label, value, onCopy }) {
  if (!value) return null

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: brand.muted }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, color: brand.text, fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
      </Box>
      <IconButton aria-label={`Copy ${label}`} onClick={() => onCopy(value, label)} sx={{ color: brand.primary, flexShrink: 0 }}>
        <ContentCopyRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  )
}
