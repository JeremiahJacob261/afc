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
import LOGO from '../public/bradford.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Backdrop from '@mui/material/Backdrop';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import { useCookies } from 'react-cookie';
import { useEffect } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
export default function Login() {
  const [cookies, setCookie] = useCookies(['authdata']);

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
    setValues({ ...values, [prop]: event.target.value.replace(/\s/g, '') });
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
        router.push('/user');
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
        localStorage.setItem('signedIns', true);
        localStorage.setItem('signUids', user.id);
        localStorage.setItem('signNames', user.user_metadata.displayName);
      } else {

        console.log('sign out');
        localStorage.removeItem('signedIns');
        localStorage.removeItem('signUids');
        localStorage.removeItem('signNames');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
    }
    // getSe();

  }, [])
  const supabaseMigrate = async (username, uid) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: values.password,
      options: {
        data: {
          displayName: username,
        }
      }
    })
    //update email after migration
    const uidch = async () => {

      const { error } = await supabase
        .from('users')
        .update({ userId: data.user.id })
        .eq('email', email);
    }
    uidch();
    router.push('/user')

  }

  const login = async () => {
    //firebase
    const fire = async (emailer) => {
      signInWithEmailAndPassword(auth, emailer, values.password)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          // ...

          supabaseMigrate(user.displayName, user.uid);
          alert('you are Logged in');
          router.push('/user');
          console.log(user.displayName)
          localStorage.setItem('signedIns', true);
          localStorage.setItem('signUids', user.uid);
          localStorage.setItem('signNames', user.displayName);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(error.message)
          setDrop(false)
          alert(error.code);
          if (error.code === 'network-request-failed') {
            alert('Please Check Your internet connection or Check your password')
          }
        });
    }

    //end of firebase
    async function findemail() {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('username', email)

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
          console.log(error.message)
          if (error.message === 'Invalid login credentials') {
           alert("Check your Username and Password");
          } else {
            console.log(error.message)
          }
          setDrop(false)
        } else {
          // Set a cookie
          let user = data.user;
          let thecoook = JSON.stringify({ "username": user.user_metadata.displayName, "email": emailer, "id": user.id })
          setCookie('authdata', thecoook);

          setCookie('authed', true);
          // User successfully signed in
          alert('You are logged in');
          console.log(user)
          router.push('/user')
          // localStorage.setItem('signRef', data[0].newrefer);

          localStorage.setItem('signedIns', true);
          localStorage.setItem('signUids', user.id);
          localStorage.setItem('signNames', user.user_metadata.displayName);
          console.log(user.user_metadata.displayName);
        }
      }
      sign(data[0].email);
      //end of supabase sgn in

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
          console.log(error.message)
          if (error.message === 'Invalid login credentials') {
            alert("Incorrect password or email");
          } else {
            console.log(error.message);
            alert(errorMessage)
          }
          setDrop(false)
        } else {
          let user = data.user;
          let thecoook = JSON.stringify({ "username": user.user_metadata.displayName, "email": emailer, "id": user.id })
          setCookie('authdata', thecoook);
          setCookie('authed', true);
          // User successfully signed in
          alert('you are logged in');
          router.push('/user')
          console.log(user)
          // localStorage.setItem('signRef', data[0].newrefer);
         

          // console.log(test)
          localStorage.setItem('signedIns', true);
          localStorage.setItem('signUids', user.id);
          localStorage.setItem('signNames', user.user_metadata.displayName);

        }
      }
      sign(email);
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
        <Image src={LOGO} width={100} height={100} id='balls' alt="logo" sx={{ marginLeft: '8px' }} />
      </Backdrop>
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/bradford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SimpleDialog
        open={open}
        onClose={handleClose}
      />
      <Stack direction='column' spacing={3}>
        <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#CACACA", fontWeight: '400', fontSize: '20px' }}>BFC  </Typography>
          </Link>
          <Typography
            onClick={() => {

            }}
            style={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '25px', fontWeight: '400', width: '240px', textAlign: 'center' }}>
            Dont miss a minute of the action! Sign in
          </Typography>
          <Typography style={{ opacity: '0.7', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100', width: '292px', textAlign: 'center' }}>
            Enter the correct information provided to Login to your  account
          </Typography>
        </Stack>
        <Stack direction="column" spacing={4} sx={{ width: '343px' }}>
          <div>
          <p style={{ fontFamily: 'Poppins,sans-serif', color:'#CACACA', fontSize:'12px',marginBottom:'5px'  }}>email or username</p>
          <TextField id="outlined-basic" placeholder="Email Or Username" variant="filled"
            sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#CACACA', } }}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.replace(/\s/g, ''))
            }}
          />
          </div>
          <div>
          <p style={{ fontFamily: 'Poppins,sans-serif', color:'#CACACA', fontSize:'12px',marginBottom:'5px' }}>password</p>
          <FormControl
            sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#CACACA', } }}
            variant="filled">
            <InputLabel htmlFor="outlined-adornment-password" sx={{ color: 'white',input: { color: '#CACACA', } }}>Password</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              type={values.showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={handleChange('password')}
              sx={{ input: { color: '#CACACA', } }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-placeholder="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {values.showPassword ? <VisibilityOff sx={{ color: '#CACACAsmoke' }} /> : <Visibility sx={{ color: '#CACACA' }} />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>
          </div>
        </Stack>
      </Stack>
      <Stack direction="column" spacing={2} justifyContent='center' alignItems='center' sx={{ width: '343px', marginTop: '200px' }}>
        <Button variant="contained"
          onKeyDown={(event) => {
            if (
              event.key === "Enter"
            ) {
              login()
            }
          }}
          sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', fontWeight: '400', background: '#FE9D16' }}
          onClick={login}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: "#CACACAsmoke" }}>Login</Typography>
        </Button>
        <Link href="/passwordreset" style={{ textDecoration: '#CACACA' }}>
          <Typography style={{ color: "#CACACA", fontSize: '14px', fontWeight: '200', opacity: '0.7', fontFamily: 'Poppins,sans-serif' }}>Forgotten Password ?</Typography>
          <Divider sx={{ background: '#CACACA' }} />
        </Link>
        <Link href="/register/000208" style={{ width: '100%', textAlign: 'center', textDecoration: "none", color: "#CACACA", fontSize: '15px', fontWeight: '400', fontFamily: 'Poppins,sans-serif' }}>Dont have an Account ?
          Create Account

        </Link>
      </Stack>
    </Stack>
  )
}



