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
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { async } from "@firebase/util";
export default function Login() {
  const dbs = getDatabase(app);
  const [username, setUsername] = useState("")
  const [open, setOpen] = React.useState(false);
  const [drop, setDrop] = useState(false)
  const router = useRouter();
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
  };
  const [values, setValues] = React.useState({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  });

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        router.push('/user');
      } else {
        // User is signed out
        // ...
        console.log('sign out');
      }
    });
  }, [])
  
  const login = async () => {
   
    async function findemail(){
      const {data,error} = await supabase
      .from('users')
      .select('email')
      .eq('username',email)
      signInWithEmailAndPassword(auth, data[0].email, values.password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        // ...

        alert('you are logged in');

        setDrop(false)
        router.push('/user');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error.message)
        alert(errorCode);
        setDrop(false)
      });
    }
setDrop(true)
    localStorage.clear()
    if(!email.includes("@")){
      const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)
    console.log(count);
    if (count > 0) {
      
      findemail()
    }else{
alert('username does not exist')
setDrop(false)
    }
    }else{
      signInWithEmailAndPassword(auth, email, values.password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        // ...

        alert('you are logged in');

        setDrop(false)
        router.push('/user');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error.message)
        alert(errorCode);
        setDrop(false)
      });
    }
    
    
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
        <title>Login</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
        <SimpleDialog
          open={open}
          onClose={handleClose}
        />
        <Link href="/" style={{ textDecoration: "none"}}>
<Typography variant="h1" style={{ fontFamily: 'Poppins, sans-serif', color: "#181AA9",fontWeight:'900',fontSize:'64px' }}>AFCFIFA </Typography>
       
        </Link>
         <Typography variant='subtitle' sx={{ fontFamily: 'Poppins, sans-serif', fontSize: "15px", color: "#181AA9" }}>
          Investment Bet</Typography>
          <Typography variant="h1" style={{ fontFamily: 'Poppins, sans-serif', color: "white",fontWeight:'900',fontSize:'32px' }}>LOGIN </Typography>
        
        <TextField id="outlined-basic" label="Email Or Username" variant="filled"
          sx={{ width: "100%", background: "#F2F4CB"}}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
        />
                <FormControl 
                sx={{ m: 1, width: "100%", background: "#F2F4CB"}} variant="filled">
          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            type={values.showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={handleChange('password')}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {values.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
        </FormControl>
       <Link href="/passwordreset" style={{textDecoration:'none'}}> <Typography style={{ textDecoration: "none", color: "#9D9EF1",fontSize:'15px',fontWeight:'400' }}>forgotten password</Typography>
       </Link>
        <Button variant="contained" sx={{ width:'191px',height:'65px',background:'#21227A'  }} onClick={login}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "whitesmoke"}}>Login</Typography>
        </Button>

       
          <Link href="/register/697667" style={{ textDecoration: "none", color: "#DFA100",fontSize:'15px',fontWeight:'400' }}>Dont have an Account ? <br/>
Create Account

          </Link>

    </Stack>
  )
}
