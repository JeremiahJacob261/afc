import React, { useState } from "react";
import Head from "next/head";
import { Avatar, Box, Stack, OutlinedInput, Button, Typography } from "@mui/material";
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
import LOGO from '../public/logo_afc.ico'
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
 const [email,setEmail] = useState('')
 const auth = getAuth(app);
 const router = useRouter();
 const [drop, setDrop] = useState(false)
async function reset(){
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
      justifyContent="center"
      alignItems="center"
      spacing={2}
      style={{
        padding: "15px",
        overflowX: "hidden",
        maxWidth: "100%",
        minHeight: "85vh"
      }}>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Head>
        <title>Password Reset</title>
        <meta name="description" content="afcfifa security settings" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
        <Link href="/" style={{ textDecoration: "none"}}>
<Typography variant="h1" style={{ fontFamily: 'Poppins, sans-serif', color: "#181AA9",fontWeight:'900',fontSize:'64px' }}>AFCFIFA </Typography>
       
        </Link>
         <Typography variant='subtitle' sx={{ fontFamily: 'Poppins, sans-serif', fontSize: "15px", color: "#181AA9" }}>
          Investment Bet</Typography>
          <Typography variant="h1" style={{ fontFamily: 'Poppins, sans-serif', color: "white",fontWeight:'900',fontSize:'32px' }}>PASSWORD RESET </Typography>
        
        <TextField id="outlined-basic" label="Email" variant="filled"
          sx={{ width: "100%", background: "#F2F4CB"}}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
        />
        <Button variant="contained" sx={{ width:'191px',height:'65px',background:'#21227A'  }} onClick={reset}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "whitesmoke"}}>Reset Password</Typography>
        </Button>

       
          <Link href="/register/697667" style={{ textDecoration: "none", color: "#DFA100",fontSize:'15px',fontWeight:'400' }}>Dont have an Account ? <br/>
Create Account

          </Link>

    </Stack>
  )
}
