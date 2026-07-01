import React, { useState } from "react";
import Head from "next/head";
import { Stack, Button, Typography, Divider } from "@mui/material";
import TextField from '@mui/material/TextField';
import { app } from '@/pages/api/firebase'
import Link from "next/link";
import { useRouter } from 'next/router'
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import AppLoadingOverlay from '@/components/AppLoadingOverlay';
import FeedbackDialog from '@/components/FeedbackDialog';
import { waitForPaint } from '@/lib/uiFeedback';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
export default function PasswordReset() {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  async function reset() {
    if (loading) return
    if (!email.trim()) {
      toast.error(t('messages.enterEmailAddress'))
      return
    }

    setLoading(true)
    await waitForPaint()

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setFeedback({
        type: 'success',
        title: t('messages.resetEmailSentTitle'),
        message: t('messages.resetEmailSentMessage'),
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        title: t('messages.unableSendEmail'),
        message: error?.code || error?.message || t('messages.pleaseTryAgain'),
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Stack
      direction="column"
      alignItems="center"
      spacing={2}
      style={{
        padding: "15px",
        overflowX: "hidden",
        maxWidth: "100%",
        minHeight: "100vh",
        background: '#0B122C'
        , position: 'relative'
      }}>
      <AppLoadingOverlay open={loading} title={t('messages.sendingEmailTitle')} message={t('messages.sendingEmailMessage')} />
      <FeedbackDialog
        open={Boolean(feedback)}
        type={feedback?.type}
        title={feedback?.title}
        message={feedback?.message}
        onClose={() => {
          const shouldReturn = feedback?.type === 'success'
          setFeedback(null)
          if (shouldReturn) router.push('/login')
        }}
      />
      <Toaster position="bottom-center" reverseOrder={false} />
      <Head>
        <title>{t('auth.reset.title')}</title>
        <meta name="description" content={t('auth.reset.subtitle')} />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center">
        <Link href="/" style={{ textDecoration: "none" }}>
          <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#242627", fontWeight: '400', fontSize: '20px' }}>{t('common.appName')}</Typography>
        </Link>
        <Typography style={{ fontFamily: 'Poppins,sans-serif', color: '#242627', fontSize: '25px', fontWeight: '400', width: '240px', textAlign: 'center' }}>
          {t('auth.reset.title')}
        </Typography>
        <Typography style={{ opacity: '0.7', fontFamily: 'Poppins,sans-serif', color: '#242627', fontSize: '14px', fontWeight: '100', width: '292px', textAlign: 'center' }}>
          {t('auth.reset.subtitle')}
        </Typography>
      </Stack>
      <TextField id="outlined-basic" label={t('auth.register.email')} variant="filled"
        sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #242627', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#242627', } }}

        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
        }}
      />
      <Stack direction="column" spacing={2} justifyContent='center' alignItems='center' sx={{ width: '343px', position: 'absolute', bottom: 55 }}>
        <Button variant="contained" disabled={loading} sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', background: '#FE9D16' }} onClick={reset}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "#242627smoke" }}>{loading ? t('auth.reset.submitting') : t('auth.reset.submit')}</Typography>
        </Button>
        <Typography>
          <Link href="/login" style={{ textDecoration: "none", fontSize: '14px', fontWeight: '100', color: "#242627", opacity: '1.0', fontFamily: 'Poppins,sans-serif' }}>{t('common.login')}</Link>
          <Divider sx={{ background: '#242627' }} />
        </Typography>

      </Stack>



    </Stack>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await getI18nServerSideProps(locale)),
    },
  }
}
