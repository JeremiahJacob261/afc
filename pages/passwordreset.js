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
export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  async function reset() {
    if (loading) return
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    await waitForPaint()

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setFeedback({
        type: 'success',
        title: 'Reset email sent',
        message: 'A message has been sent to your email. Follow the instructions there to change your password.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Unable to send email',
        message: error?.code || error?.message || 'Please try again.',
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
      <AppLoadingOverlay open={loading} title="Sending email" message="Preparing your password reset link." />
      <FeedbackDialog
        open={Boolean(feedback)}
        type={feedback?.type}
        title={feedback?.title}
        message={feedback?.message}
        onClose={() => {
          const shouldReturn = feedback?.type === 'success'
          setFeedback(null)
          if (shouldReturn) router.push('/signin')
        }}
      />
      <Toaster position="bottom-center" reverseOrder={false} />
      <Head>
        <title>Password Reset</title>
        <meta name="description" content="european security settings" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center">
        <Link href="/" style={{ textDecoration: "none" }}>
          <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#242627", fontWeight: '400', fontSize: '20px' }}>EFC  </Typography>
        </Link>
        <Typography style={{ fontFamily: 'Poppins,sans-serif', color: '#242627', fontSize: '25px', fontWeight: '400', width: '240px', textAlign: 'center' }}>
          Forgot Password? Dont worry
        </Typography>
        <Typography style={{ opacity: '0.7', fontFamily: 'Poppins,sans-serif', color: '#242627', fontSize: '14px', fontWeight: '100', width: '292px', textAlign: 'center' }}>
          We would send you a link to your email so you can reset your password
        </Typography>
      </Stack>
      <TextField id="outlined-basic" label="Email" variant="filled"
        sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #242627', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#242627', } }}

        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
        }}
      />
      <Stack direction="column" spacing={2} justifyContent='center' alignItems='center' sx={{ width: '343px', position: 'absolute', bottom: 55 }}>
        <Button variant="contained" disabled={loading} sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', background: '#FE9D16' }} onClick={reset}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "#242627smoke" }}>{loading ? 'Sending...' : 'Send Email'}</Typography>
        </Button>
        <Typography>
          <Link href="/signin" style={{ textDecoration: "none", fontSize: '14px', fontWeight: '100', color: "#242627", opacity: '1.0', fontFamily: 'Poppins,sans-serif' }}>Return To Login</Link>
          <Divider sx={{ background: '#242627' }} />
        </Typography>

      </Stack>



    </Stack>
  )
}
