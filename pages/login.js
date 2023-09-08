import React, { useState, Suspense } from "react";
import Head from "next/head";
import { Avatar, Box, Stack, OutlinedInput, Button, Typography, Divider } from "@mui/material";
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
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Loadingsc from "./overlays/loadingsc";
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
    async function getSe() {

      const { data, error } = await supabase.auth.getSession();
      if (data.session != null) {
        console.log(data.session)
        let user = data.session.user;
        async function GET() {
          try {
            const { data, error } = await supabase
              .from('users')
              .select()
              .eq('username', user.user_metadata.displayName);
            localStorage.setItem('signRef', data[0].newrefer);
            console.log(data);
          } catch (e) {

          }

        }
        GET();
        localStorage.setItem('signedIn', true);
        localStorage.setItem('signUid', user.id);
        localStorage.setItem('signName', user.user_metadata.displayName);
        router.push('/user');
      } else {

        console.log('sign out');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
    }
    getSe();
    //       if (user) {
    //         // User is signed in, see docs for a list of available properties
    //         // https://firebase.google.com/docs/reference/js/auth.user
    //         const uid = user.uid;
    //         // ...
    //         async function GET() {
    //           try{
    //  const { data, error } = await supabase
    //             .from('users')
    //             .select()
    //             .eq('username', user.displayName);
    //           localStorage.setItem('signRef', data[0].newrefer);
    //           console.log(data);
    //           }catch(e){

    //           }

    //         }
    //         // GET();

    //         console.log(localStorage.getItem('signInfo'))
    //         localStorage.setItem('signedIn', true);
    //         localStorage.setItem('signUid', uid);
    //         localStorage.setItem('signName', user.displayName);
    //         router.push('/user');
    //       } else {
    //         // User is signed out
    //         // ...
    //         console.log('sign out');b 
    //         localStorage.removeItem('signedIn');
    //         localStorage.removeItem('signUid');
    //         localStorage.removeItem('signName');
    //         localStorage.removeItem('signRef');
    //       }
  }, [])
  const supabaseMigrate = async (username, uid) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: values.password,
      options: {
        data: {
          displayName: username,
          uid: uid,
        }
      }
    })
    const uidch = async () =>{

const { error } = await supabase
.from('users')
.update({ userId: data.user.id })
.eq('email', email);
    }
    uidch();
    router.push('/user')

  }
  const login = async () => {

    async function findemail() {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('username', email)

        //supabase sign in
      async function sign(emailer) {
        const { user, error } = await supabase.auth.signInWithPassword({
          email: emailer,
          password: values.password,
        });

        if (error) {
          // Handle authentication error
          console.error(error);
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error.message)
          alert(errorCode);
          setDrop(false)
        } else {
          // User successfully signed in
          console.log(user);
          alert('you are logged in');
          localStorage.setItem('signRef', data[0].newrefer);
          localStorage.setItem('signedIn', true);
          localStorage.setItem('signUid', user.id);
          localStorage.setItem('signName', user.user_metadata.displayName);
          setDrop(false)
        }
      }
      //end of supabase sgn in
      //firebase
      signInWithEmailAndPassword(auth, data[0].email, values.password)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          // ...

          supabaseMigrate(user.displayName, user.uid);
          alert('you are logged in');
          localStorage.setItem('signedIn', true);
          localStorage.setItem('signUid', user.uid);
          localStorage.setItem('signName', user.displayName);
          setDrop(false)
          router.push('/user');
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error.message)
          setDrop(false)
          if (errorCode === 'auth/user-not-found') {

            sign(data[0].email)
          } else {
            alert(error.message);
          }
        });
        //end of firebase
      // signInWithEmailAndPassword(auth, data[0].email, values.password)
      //   .then((userCredential) => {
      //     // Signed in 
      //     const user = userCredential.user;
      //     // ...

      //     alert('you are logged in');
      //     localStorage.setItem('signRef', data[0].newrefer);
      //     localStorage.setItem('signedIn', true);
      //     localStorage.setItem('signUid', user.uid);
      //     localStorage.setItem('signName', user.displayName);
      //     setDrop(false)
      //     router.push('/user');
      //   })
      //   .catch((error) => {
      //     const errorCode = error.code;
      //     const errorMessage = error.message;
      //     console.log(error.message)
      //     alert(errorCode);
      //     setDrop(false)
      //   });
    }
    setDrop(true)
    localStorage.clear()
    if (!email.includes("@")) {
      let usern = username.replace(/^\s+|\s+$/gm, '')
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('username', email)
      console.log(count);
      if (count > 0) {

        findemail()
      } else {
        alert('username does not exist or check your internet connection')
        setDrop(false)
      }
    } else {
      async function sign(emailer) {

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailer,
          password: values.password,
        })
        if (error) {
          // Handle authentication error
          console.error(error);
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error)
          alert(errorCode);
          setDrop(false)
        } else {
          // User successfully signed in
          let user = data.user;
          alert('you are logged in');
          // localStorage.setItem('signRef', data[0].newrefer);
          localStorage.setItem('signedIn', true);
          localStorage.setItem('signUid', user.id);
          localStorage.setItem('signName', user.user_metadata.displayName);
          setDrop(false)
          router.push('/user')
        }
      }
      //firebase
      signInWithEmailAndPassword(auth, email, values.password)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          // ...

          supabaseMigrate(user.displayName, user.uid);
          alert('you are logged in');
          localStorage.setItem('signedIn', true);
          localStorage.setItem('signUid', user.uid);
          localStorage.setItem('signName', user.displayName);
          setDrop(false)
          router.push('/user');
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error.message)
          alert(errorCode);
          setDrop(false)
          if (error.message === 'auth/user-not-found') {

            sign(email);
          } else {
            alert(error.message);
          }
        });
        //end of firebase
    }


  }


  return (
    <Stack
      direction="column"
      alignItems="center"
      spacing={10}
      style={{
        padding: "15px",
        overflowX: "hidden",
        maxWidth: "100%",
        minHeight: "100vh",
        background: '#0B122C'
        , position: 'relative'
      }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
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
      <Stack direction='column' spacing={3}>
        <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#E5E7EB", fontWeight: '400', fontSize: '20px' }}>AFCFIFA </Typography>
          </Link>
          <Typography style={{ fontFamily: 'Poppins,sans-serif', color: '#E5E7EB', fontSize: '25px', fontWeight: '400', width: '240px', textAlign: 'center' }}>
            Dont miss a minute of the action! Sign in
          </Typography>
          <Typography style={{ opacity: '0.7', fontFamily: 'Poppins,sans-serif', color: '#E5E7EB', fontSize: '14px', fontWeight: '100', width: '292px', textAlign: 'center' }}>
            Enter the correct information provided to Login to your  account
          </Typography>
        </Stack>
        <Stack direction="column" spacing={4} sx={{ width: '343px' }}>
          <TextField id="outlined-basic" label="Email Or Username" variant="filled"
            sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #E5E7EB', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#E5E7EB', } }}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
          />
          <FormControl
            sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #E5E7EB', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#E5E7EB', } }}
            variant="filled">
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
                    {values.showPassword ? <VisibilityOff sx={{ color: '#E5E7EBsmoke' }} /> : <Visibility sx={{ color: '#E5E7EB' }} />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>
        </Stack>
      </Stack>
      <Stack direction="column" spacing={2} justifyContent='center' alignItems='center' sx={{ width: '343px', marginTop: '200px' }}>
        <Button variant="contained" sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', fontWeight: '400', background: '#FE9D16' }}
          onClick={login}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "#E5E7EBsmoke" }}>Login</Typography>
        </Button>
        <Link href="/passwordreset" style={{ textDecoration: '#E5E7EB' }}>
          <Typography style={{ color: "#E5E7EB", fontSize: '14px', fontWeight: '200', opacity: '0.7', fontFamily: 'Poppins,sans-serif' }}>Forgotten Password ?</Typography>
          <Divider sx={{ background: '#E5E7EB' }} />
        </Link>
        <Link href="/register/000208" style={{ width: '100%', textAlign: 'center', textDecoration: "none", color: "#E5E7EB", fontSize: '15px', fontWeight: '400', fontFamily: 'Poppins,sans-serif' }}>Dont have an Account ?
          Create Account

        </Link>
      </Stack>
    </Stack>
  )
}
