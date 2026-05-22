import React, { useState, Suspense } from "react";
import Head from "next/head";
import Backdrop from '@mui/material/Backdrop';
import { ArrowLeft, Lock, ArrowRight, User } from "lucide-react";
import { supabase } from './api/supabase'
import Link from "next/link";
import SimpleDialog from './modal'
import { useRouter } from 'next/router'
import LOGO from '@/public/european.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useEffect } from "react";
import { clearLegacyAuthStorage } from '@/lib/clientAuth';

export default function Login() {
  const [open, setOpen] = React.useState(false);
  const [drop, setDrop] = useState(false)
  const router = useRouter();
  const [email, setEmail] = useState('')


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
              .select('newrefer')
              .eq('userid', user.id)
              .maybeSingle();
            console.log(data);
          } catch (e) {

          }

        }
        GET();
        clearLegacyAuthStorage();
      } else {

        console.log('sign out');
        clearLegacyAuthStorage();
        router.push('/login');
      }
    }
    // getSe();

  }, [])
  const login = async () => {
    setDrop(true)
    clearLegacyAuthStorage()

    try {
      let loginEmail = email.trim()

      if (!loginEmail.includes("@")) {
        const response = await fetch('/api/login-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginEmail })
        })
        const result = await response.json()

        if (!response.ok || result.status !== 'success') {
          alert('Check your Username and Password')
          setDrop(false)
          return
        }

        loginEmail = result.email
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: values.password,
      })

      if (error) {
        console.error(error)
        alert(error.message === 'Invalid login credentials' ? 'Incorrect login details' : error.message)
        setDrop(false)
        return
      }

      clearLegacyAuthStorage()
      router.push('/user')
    } catch (error) {
      console.error(error)
      alert('Please check your internet connection and try again')
      setDrop(false)
    }
  }


  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/european.ico" />
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
              <p className="text-gray-500 text-sm">Sign in to access your Investment Bets</p>
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
