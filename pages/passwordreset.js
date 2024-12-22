import React, { useState } from "react";
import Head from "next/head";
import { Avatar, Box, Stack, OutlinedInput, Button, Typography,Divider } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { supabase } from './api/supabase'
import { app } from './api/firebase'
import { useContext } from "react";
import Link from "next/link";
import { getDatabase } from 'firebase/database'
import SimpleDialog from './modal'
import { useRouter } from 'next/router'
import { getCookie, setCookie, removeCookies } from 'cookies-next';
import LOGO from '../public/bradford.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { async } from "@firebase/util";
export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
  const router = useRouter();
  const [drop, setDrop] = useState(false)
  async function reset() {
    setDrop(true)
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert('A message has been sent to your E-Mail, follow the instruction to change your password')
        // Password reset email sent!
        setDrop(false)
        router.push('/login')
        // ..
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
        alert(errorCode)
        setDrop(false)
      });
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
        ,position:'relative'
      }}>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Head>
        <title>Password Reset</title>
        <meta name="description" content="afc  security settings" />
        <link rel="icon" href="/bradford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#242627", fontWeight: '400', fontSize: '20px' }}>BFC  </Typography>
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
      <Stack direction="column" spacing={2} justifyContent='center' alignItems='center' sx={{width:'343px',position:'absolute',bottom:55}}>
        <Button variant="contained"  sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', background: '#FE9D16' }} onClick={reset}>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "#242627smoke" }}>Send Email</Typography>
      </Button>
      <Typography>
              <Link href="/login" style={{ textDecoration: "none", fontSize: '14px', fontWeight: '100', color: "#242627", opacity: '1.0', fontFamily: 'Poppins,sans-serif' }}>Return To Login</Link>
              <Divider sx={{background:'#242627'}}/>
              </Typography>
      
      </Stack>
      


    </Stack>
  )
}
