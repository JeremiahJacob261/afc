import Cover from "./cover";
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { Stack, Typography, TextField, Button, Divider } from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from 'framer-motion';
import Big from '@/public/icon/badge.png'
import Modal from '@mui/material/Modal';
import Wig from '@/public/icon/wig.png'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { useTranslation } from 'next-i18next';

export default function Code() {
  const { t } = useTranslation('common')
  const [pin, setPin] = useState('')
  const [cpin, setCPin] = useState('')
  const router = useRouter();
  const [open, setOpen] = useState(false)
  const [ale, setAle] = useState(false)
  const [aleT, setAleT] = useState(false)
  const [pinSet, setPinSet] = useState(false)
  const [loadingPinStatus, setLoadingPinStatus] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const Alerts = (m, t) => {
    setAle(m)
    setAleT(t)
    setOpen(true)
  }
  useEffect(() => {
    let active = true;

    const check = async () => {
      const session = await requireSession(router);
      if (!session) return;

      clearLegacyAuthStorage();

      try {
        const response = await authFetch('/api/me');
        if (response.status === 401 || response.status === 404) {
          router.push('/login');
          return;
        }

        const result = await response.json();
        if (!active || result.status !== 'success') return;

        const hasPin = Boolean(result.profile?.codeset);
        setPinSet(hasPin);

        if (hasPin) {
          toast.error(t('messages.pinAlreadySet'));
        }
      } catch {
        if (active) toast.error(t('messages.unableLoadPin'))
      } finally {
        if (active) setLoadingPinStatus(false);
      }
    }

    check();

    return () => {
      active = false;
    }
  }, [router, t])

  const nextPage = async () => {
    if (loadingPinStatus || submitting) return;

    if (pinSet) {
      toast.error(t('messages.pinAlreadySet'));
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast.error(t('messages.pinFourDigits'));
      return;
    }

    if (pin !== cpin) {
      toast.error(t('messages.pinEntriesMustMatch'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch('/api/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setPinSet(true);
        setPin('');
        setCPin('');
        Alerts(result.message || t('messages.pinSet'), true);
        return;
      }

      if (response.status === 409) {
        setPinSet(true);
      }

      toast.error(result.message || t('messages.unableSetPin'));
    } catch {
      toast.error(t('messages.unableSetPin'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputLocked = loadingPinStatus || submitting || pinSet;

  return (
    <Cover>
      <Toaster position="bottom-center" reverseOrder={false} />
      <Alertz />
      <Stack direction='column' alignItems='stretch' sx={{ maxWidth: '560px', width: '100%', margin: '0 auto' }} spacing={3}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px', minWidth: 0 }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
            router.push('/user/account')
          }} />
          <Typography component="h1" sx={{ fontSize: { xs: '32px', sm: '48px' }, fontFamily: 'Georgia,serif', color: '#080f32' }}>{t('mobile.profile.codeSetting')}</Typography>
        </Stack>
        <Stack direction='row' justifyContent='center' alignItems='center' sx={{ height: 'auto', background: '#eaf0fb', borderRadius: '8px', padding: '16px', width: '100%' }} spacing={2}>
          <PriorityHighRoundedIcon sx={{ color: '#fdfcf8', background: '#0649ff', width: '20px', height: '20px', borderRadius: '10px' }} />
          <Typography sx={{ fontSize: '15px', fontFamily: 'Arial,sans-serif', fontWeight: '400', color: '#0649ff' }}>{t('mobile.pin.warning')}</Typography>
        </Stack>
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Arial,sans-serif', color: '#080f32' }}>{t('forms.enterPin')}</Typography>
          <TextField
            sx={{ input: { color: '#080f32', }, border: "1px solid #F5F5F5" }}
            value={pin}
            label={t('forms.enterPin')}
            type='pin'
            disabled={inputLocked}
            inputProps={{ inputMode: 'numeric', maxLength: 4 }}
            onChange={(p) => {
              if (!isNaN(p.target.value)) {
                if (p.target.value.length <= 4) {
                  setPin(p.target.value)
                }
              }

            }}
          />
        </Stack>
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Arial,sans-serif', color: '#080f32' }}>{t('forms.confirmPin')}</Typography>
          <TextField
            sx={{ input: { color: '#080f32', }, border: "1px solid #F5F5F5" }}
            label={t('forms.enterPin')}
            type='password'
            value={cpin}
            disabled={inputLocked}
            inputProps={{ inputMode: 'numeric', maxLength: 4 }}
            onChange={(p) => {
              if (!isNaN(p.target.value)) {
                if (p.target.value.length <= 4) {
                  setCPin(p.target.value)
                }
              }
            }}
          />
        </Stack>
        <Button
          disabled={inputLocked}
          variant="contained"
          sx={{ minHeight: '48px', borderRadius: '8px', fontSize: '16px', fontWeight: 700, background: '#0649ff', textTransform: 'none' }}
          onClick={nextPage}
        >
          {loadingPinStatus ? t('mobile.pin.checking') : pinSet ? t('messages.pinAlreadySet') : submitting ? t('status.pending') : t('mobile.pin.set')}
        </Button>
      </Stack>
    </Cover>
  )
  function Alertz() {
    return (
      <Modal
        open={open}
        onClose={() => {
          if (aleT) {
            setOpen(false)
          } else {
            setOpen(false)
          }
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack alignItems='center' justifyContent='space-evenly' sx={{
          background: '#fdfcf8', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Arial,sans-serif', fontSize: '20px', fontWeight: '500', color: '#080f32' }}>

            {aleT ? t('status.success') : t('errors.generic')}
          </Typography>
          <Typography id="modal-modal-description" sx={{ fontFamily: 'Arial,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#080f32' }}>
            {ale}
          </Typography>
          <Divider sx={{ background: '#080f32' }} />
          <Button variant='contained' sx={{ fontFamily: 'Arial,sans-serif', color: '#fdfcf8', background: '#0649ff', padding: '8px', width: '100%' }} onClick={() => {
            if (aleT) {
              setOpen(false)
              router.push('/user/account')
            } else {
              setOpen(false)
            }

          }}>{t('common.continue')}</Button>
        </Stack>

      </Modal>)
  }
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return {
    props: {
      ...i18nProps,
    },
  }
}
