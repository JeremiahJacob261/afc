import React, { useState, Suspense } from "react";
import Head from "next/head";
import { Avatar, Box, Stack, OutlinedInput, Button, Typography, Divider } from "@mui/material";
import { ArrowLeft, Lock, ArrowRight, User } from "lucide-react";
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

export default function Login() {
  const [cookies, setCookie] = useCookies(['authdata']);

  const dbs = getDatabase(app);
  const [username, setUsername] = useState("")
  const [open, setOpen] = React.useState(false);
  const [drop, setDrop] = useState(false)
  const router = useRouter();
  const [email, setEmail] = useState('')
  const auth = getAuth(app);


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
        .update({ userid: data.user.id })
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/bradford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <Image src={LOGO} width={100} height={100} id='balls' alt="logo" />
      </Backdrop>
      <SimpleDialog
        open={open}
        onClose={handleClose}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#1BB6FF]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#FF4FA3]/10 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src={LOGO} alt="EFC Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-3xl font-black tracking-[-0.04em] text-gray-900">EFC</span>
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ECFC4] to-[#1BB6FF]" />
            
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-black tracking-tight mb-2">Welcome Back</h1>
              <p className="text-gray-500 text-sm">Sign in to access your premium analytics</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); login(); }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Email or Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Email or Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link href="/passwordreset" className="text-xs text-[#1BB6FF] hover:text-[#2ECFC4] transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type={values.showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange('password')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all"
                    required
                  />
                  <button type="button" onClick={handleClickShowPassword} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                    {values.showPassword ? <VisibilityOff className="w-5 h-5" /> : <Visibility className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#1BB6FF] hover:bg-[#2ECFC4] text-[#06101F] font-bold rounded-xl py-3.5 transition-all hover:shadow-[0_0_20px_rgba(27,182,255,0.3)] mt-2 group"
              >
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register/000208" className="text-gray-900 font-semibold hover:text-[#1BB6FF] transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



