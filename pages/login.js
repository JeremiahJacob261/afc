import React, { useState } from "react";
import Head from "next/head";
import { Avatar, Box, Stack,OutlinedInput,Button, Typography } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import {supabase} from './api/supabase'
import {app} from './api/firebase'
import { useContext } from "react";
import {AppContext} from "./api/Context";
import Link from "next/link";
import {getDatabase} from 'firebase/database'
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
import {  onAuthStateChanged } from "firebase/auth";
export default function Login() {
  const dbs = getDatabase(app);
  const [username,setUsername] = useState("")
const {info,setInfo} = useContext(AppContext);
const [open, setOpen] = React.useState(false);
const [drop,setDrop]=useState(false)
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
useEffect(()=>{
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
},[])
const login=async()=>{

  setDrop(true)
  localStorage.clear()
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
    
  
    return(
        <Stack 
        direction="column" 
        justifyContent="center"
        alignItems="center"
        spacing={2}
        style={{
          padding:"15px",
          overflowX: "hidden",
          maxWidth:"100%",
          height:"100%"
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
       <Box>
       <SimpleDialog
        open={open}
        onClose={handleClose}
      />
       
        <Stack direction="column" 
        justifyContent="center"
        alignItems="center"
        spacing={2}
        sx={{maxWidth:"350px",height:"100%",padding:"16px", overflowX: "hidden",
        background:"#2D3142"}}><Image src={LOGO} alt='loginimg' width='50' height='65' />
          <Typography variant="h3" style={{fontFamily: 'Marhey, cursive',color:"white"}}>ATALANTA </Typography>
      <Typography variant='caption' sx={{fontFamily: 'Work Sans, sans-serif',fontSize:"20px",color:"white"}}>
        Investment Bet</Typography>
            
        <TextField id="outlined-basic" label="Email" variant="outlined" 
        style={{width:"100%",background:"whitesmoke"}}
      value={email}
      onChange={(e)=>{
        setEmail(e.target.value)
      }}
      />
 <FormControl sx={{ m: 1,width:"100%",background:"whitesmoke" }} variant="outlined">
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
        <Button variant="contained" sx={{padding:"6px",width:"100%"}} onClick={login}>
        <Typography sx={{fontFamily: 'Zen Antique, serif',marginLeft:"3px",color:"whitesmoke"}}>Login</Typography>
        </Button>
       
          <Typography sx={{color:"whitesmoke"}}>Dont have an Account yet ? 
             <Link href="/register/697667" style={{textDecoration:"none",color:"white"}}>Sign Up
            </Link></Typography>
            
          <Typography sx={{color:"whitesmoke",fontSize:"12px"}} variant="caption">Still Wish To Know More About Us?
             <Link href="/" style={{textDecoration:"none",color:"white"}}> Return To Home
            </Link></Typography>
        </Stack>
       </Box>
        </Stack>
    )
}
