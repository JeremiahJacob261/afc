import React, { useState, useContext, useEffect } from "react";
import Head from "next/head";
import Link from 'next/link'
import { Stack } from "@mui/material";
import { ArrowLeft, Mail, Lock, ArrowRight, User, Globe, Phone, Hash } from "lucide-react";
import { useRouter } from 'next/router'
import LOGO from '@/public/european.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '@/pages/api/supabase'
import codes from '@/pages/api/codeswithflag.json'
import { clearLegacyAuthStorage } from '@/lib/clientAuth';
import AppLoadingOverlay from '@/components/AppLoadingOverlay';
import FeedbackDialog from '@/components/FeedbackDialog';
import { waitForPaint } from '@/lib/uiFeedback';
import toast, { Toaster } from 'react-hot-toast';
export default function Register({ refer }) {

  const [password, setPassword] = useState("")
  const [cpassword, setcPassword] = useState("")
  const route = useRouter();
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [age, setAge] = useState("+91");

  const [loading, setLoading] = useState(false);
  const [idR, setidR] = useState(refer);
  const [agecheck, setAgecheck] = useState(false);
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState(null)

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
  }, [refer]);

  const showErrorDialog = (message, title = 'Unable to create account') => {
    setFeedback({ type: 'error', title, message })
  }

  const handleRegister = async () => {
    if (loading) return

    if (phone.length < 9) {
      toast.error('Please input a complete phone number with at least 9 digits')
      return
    }

    if (!agecheck) {
      toast.error('Please accept the terms and conditions before you continue')
      return
    }

    if (cpassword !== values.password) {
      toast.error('Please make sure both passwords are the same')
      return
    }

    setLoading(true)
    await waitForPaint()

    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error('Unable to validate username right now')
        return
      }

      if (!result.available) {
        toast.error('Username already exists')
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: values.password,
        options: {
          data: {
            displayName: username,
            phoneNumber: phone,
          }
        }
      })

      console.log('User registered successfully:', data.user);
      console.log(data)

      if (error) throw error;

      const profileResponse = await fetch('/api/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: data.user.id,
          username,
          email,
          phone,
          countrycode: age,
          refer: idR,
        }),
      })
      const profileResult = await profileResponse.json().catch(() => ({}))

      if (!profileResponse.ok || profileResult.status !== 'success') {
        throw new Error(profileResult.message || 'Unable to create user profile')
      }

      clearLegacyAuthStorage();
      setLoading(false)
      setFeedback({
        type: 'success',
        title: 'Welcome to EFC',
        message: 'Your account has been created successfully.',
      })
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.message === 'User already registered') {
        showErrorDialog('Email already exists!', 'Email already registered')
      } else if (error.message === 'Password should be at least 6 characters') {
        showErrorDialog('For security reasons, please choose a stronger password. It should be at least 8 characters long and include a mix of letters, numbers, and symbols.', 'Use a stronger password')
      } else if (error.message === 'Unable to validate email address: invalid format') {
        showErrorDialog('Please enter a valid email address.', 'Invalid email')
      } else if (error.message === 'Username Already Exist!') {
        toast.error('Username already exists')
      } else {
        showErrorDialog('Please check your internet connection and try again. If the problem persists, please contact support.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
      <Head>
        <title>Register</title>
        <meta name="description" content="Register With us to get the latest betting market and fantantic Bonus" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLoadingOverlay open={loading} title="Creating account" message="Setting up your EFC profile." />
      <FeedbackDialog
        open={Boolean(feedback)}
        type={feedback?.type}
        title={feedback?.title}
        message={feedback?.message}
        onClose={() => {
          const shouldGoHome = feedback?.type === 'success'
          setFeedback(null)
          if (shouldGoHome) route.push('/user')
        }}
      />
      <Toaster position="bottom-center" reverseOrder={false} />

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

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src={LOGO} alt="EFC Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-3xl font-black tracking-[-0.04em] text-gray-900">EFC</span>
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ECFC4] to-[#1BB6FF]" />

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-black tracking-tight mb-2">Create an Account</h1>
              <p className="text-gray-500 text-sm">Join EFC and start your premium analytics journey</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              handleRegister()
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Country Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm appearance-none"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    >
                      {codes.countries.map((c) => (
                        <option value={c.code} key={c.name} className="text-gray-900">
                          {c.code} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="5550000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Referral Code (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter referral code"
                    value={idR}
                    onChange={(e) => setidR(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={values.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={values.password}
                      onChange={handleChange('password')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                    <button type="button" onClick={handleClickShowPassword} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {values.showPassword ? <VisibilityOff className="w-4 h-4" /> : <Visibility className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={values.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={cpassword}
                      onChange={(e) => setcPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1BB6FF]/50 focus:border-[#1BB6FF]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agecheck}
                    onChange={(e) => setAgecheck(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1BB6FF] focus:ring-[#1BB6FF]"
                  />
                  <span className="text-sm text-gray-600">I accept the Terms and Conditions</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1BB6FF] hover:bg-[#2ECFC4] text-[#06101F] font-bold rounded-xl py-3.5 transition-all hover:shadow-[0_0_20px_rgba(27,182,255,0.3)] mt-4 group"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-gray-900 font-semibold hover:text-[#1BB6FF] transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps(context) {
  const { params } = context;
  const id = params?.id?.[0] ?? null;  // catch-all gives array; grab first element
  return { props: { refer: id } }
}