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
      <Stack direction='column' alignItems='center' sx={{ minHeight: '90vh' }} spacing={2}>
        <Stack direction='row' alignItems='start' spacing={1} sx={{ padding: '8px', margin: '2px', minWidth: '343px' }}>
          <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
            router.push('/user/account')
          }} />
          <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>{t('mobile.profile.codeSetting')}</Typography>
        </Stack>
        <Stack direction='row' justifyContent='center' alignItems='center' sx={{ height: 'auto', background: '#FBEFEF', borderRadius: '5px', padding: '16px', maxWidth: '400px' }} spacing={2}>
          <PriorityHighRoundedIcon sx={{ color: '#06101F', background: '#1BB6FF', width: '20px', height: '20px', borderRadius: '10px' }} />
          <Typography sx={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: '#1BB6FF' }}>{t('mobile.pin.warning')}</Typography>
        </Stack>
        <Stack spacing={1} sx={{ minWidth: '344px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('forms.enterPin')}</Typography>
          <TextField
            sx={{ input: { color: '#E9E5DA', }, border: "1px solid #F5F5F5" }}
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
        <Stack spacing={1} sx={{ minWidth: '344px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('forms.confirmPin')}</Typography>
          <TextField
            sx={{ input: { color: '#E9E5DA', }, border: "1px solid #F5F5F5" }}
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
        <motion.div
          role="button"
          aria-disabled={inputLocked}
          whileTap={{ scale: inputLocked ? 1 : 1.05 }}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', bottom: 100, fontFamily: 'Poppins,sans-serif', color: '#06101F', background: '#1BB6FF', padding: '8px', minWidth: '343px', height: '50px', opacity: inputLocked ? 0.65 : 1, cursor: inputLocked && !pinSet ? 'not-allowed' : 'pointer' }}
          onClick={nextPage}
        >
          {loadingPinStatus ? t('mobile.pin.checking') : pinSet ? t('messages.pinAlreadySet') : submitting ? t('status.pending') : t('mobile.pin.set')}
        </motion.div>
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
          background: '#06101F', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#E9E5DA' }}>

            {aleT ? t('status.success') : t('errors.generic')}
          </Typography>
          <Typography id="modal-modal-description" sx={{ fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#E9E5DA' }}>
            {ale}
          </Typography>
          <Divider sx={{ background: '#E9E5DA' }} />
          <Button variant='contained' sx={{ fontFamily: 'Poppins,sans-serif', color: '#06101F', background: '#1BB6FF', padding: '8px', width: '100%' }} onClick={() => {
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
