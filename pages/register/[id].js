import React, { useState, useContext, useEffect } from "react";
import Head from "next/head";
import Link from 'next/link'
import { Modal, Box, Stack, OutlinedInput, Button, Typography, Divider } from "@mui/material";
import { ArrowLeft, Mail, Lock, ArrowRight, User, Globe, Phone, Hash } from "lucide-react";
import MenuItem from '@mui/material/MenuItem';
import { useRouter } from 'next/router'
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { Form as Farm } from 'react-bootstrap'
import LOGO from '../../public/european.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '../api/supabase'
import { app } from '../api/firebase'
import Backdrop from '@mui/material/Backdrop';
import Wig from '../../public/icon/wig.png'
import Big from '../../public/icon/badge.png'
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "firebase/auth";
import { async } from "@firebase/util";
import { useCookies } from 'react-cookie';
import codes from '../api/codeswithflag.json'
export default function Register( {refer} ) {
  
  const [password, setPassword] = useState("")
  const [cpassword, setcPassword] = useState("")
  const route = useRouter();
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [age, setAge] = useState("+91");
  
  const [cookies, setCookie] = useCookies(['authdata']);
  const [drop, setDrop] = useState(false);
  const [idR, setidR] = useState(refer);
  const [agecheck, setAgecheck] = useState(false);
  const [lvla, setLvla] = useState('');
  const [lvlb, setLvlb] = useState('');
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
  //alerts
  const [ale, setAle] = useState('')
  const [open, setOpen] = useState(false)
  const [aleT, setAleT] = useState(false)
  const Alerts = (m, t) => {
    setAle(m)
    setAleT(t)
    setOpen(true)
  }

  const generateId = ()=> {
    return Math.random().toString(36).substring(2, 12);
 }
  //end
  const nRef = generateRandomSevenDigitNumber().toString();
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

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
  };
  function generateRandomSevenDigitNumber() {
    const min = 1000000; // Smallest 7-digit number (1,000,000)
    const max = 9999999; // Largest 7-digit number (9,999,999)
    const randomSevenDigitNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomSevenDigitNumber;
  }
  const updateRef = async () => {
    const { data, error } = await supabase
      .from('referral')
      .insert({ refer: nRef, count: 0 })
  }
  const updateRefb = async () => {
    try {
      await fetch('/api/rpc/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: 1, row_id: idR })
      })
    } catch (e) { console.log(e) }
  }
  useEffect(() => {
    
    async function lvls() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('newrefer', refer)
        console.log(data);
        console.log(refer);
        setLvla(data[0].refer);
        setLvlb(data[0].lvla);
      } catch (e) {
        console.log(e);
        setLvla('');
        setLvlb('');
      }

    }
    lvls();
  }, []);

  const signup = async () => {
    setDrop(true);
    const upload = async (user) => {

      try {
        console.log(nRef)
        const { data, error } = await supabase
          .from('users')
          .insert({
            userid: user.id,
            uid: 'uid_' + generateId(),
            password: values.password,
            phone: phone,
            refer: refer,
            username: username,
            countrycode: age,
            newrefer: nRef,
            lvla: lvla,
            lvlb: lvlb,
            email: email,
          })
        console.log(error);
        console.log(data);
        let thecoook = JSON.stringify({ "username": username, "email": email, "id": user.id })
          setCookie('authdata', thecoook);

          setCookie('authed', true);
        localStorage.setItem('signedIns', true);
        localStorage.setItem('signUids', user.id);
        localStorage.setItem('signNames', username);
        localStorage.setItem('signRef', nRef);
        
       

        // const messageResponse = await fetch('https://telegram-iota-black.vercel.app/message', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     "topic": "NEW REGISTRATION 🔥🔥🔥",
        //     "message": `${username} joined BFC01 🎉.\n\n`
        //   })
        // });

        // console.log(messageResponse)
        // Usage
        
      } catch (e) {
        console.log(e)
      }
    }
    async function signUpWithEmail() {

      try {
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
        if (error) {
          throw error;
        } else {
          //getlvl2
          upload(data.user);
          updateRef();
          updateRefb();
          Alerts(`Welcome To BFC `, true);
        }
      } catch (error) {
        console.error('Error signing up:', error);
        setDrop(false);
        console.error('Error signing up:', error.message);
        if (error.message === 'User already registered') {
          Alerts('Email already exists!', false)
        } else {
          if (error.message === 'Password should be at least 6 characters') {
            Alerts('For security reasons, please choose a stronger password. It should be at least 8 characters long and include a mix of letters, numbers, and symbols', false)
          } else {
            if (error.message === 'Unable to validate email address: invalid format') {
              Alerts('Please enter a valid email address', false)
            } else {

              Alerts('Please Chcek Your internet connection and try again, if problem persist please contact support', false)
            }
          }
        }
      }
    }
    signUpWithEmail()


  }


  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative overflow-hidden">
      <Head>
        <title>Register</title>
        <meta name="description" content="Register With us to get the latest betting market and fantantic Bonus" />
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
      </Backdrop>
      <Alertz />
      
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
                if (phone.length >= 9) {
                  const checkDuplicate = async () => {
                    const { count, error } = await supabase
                      .from('users')
                      .select('*', { count: 'exact', head: true })
                      .eq('username', username)
                    if (count > 0) {
                      Alerts("Username Already Exist!", false);
                    } else {
                      if (agecheck === false) {
                        Alerts('Please click the checkBox before you continue', false)
                      } else {
                        if (cpassword === values.password) {
                          signup()
                        } else {
                          Alerts('ensure the passowords are same', false)
                        }
                      }
                    }
                  }
                  checkDuplicate()
                } else {
                  Alerts('Please Input a Complete Phone Number! at least 9 digits', false)
                }
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
                className="w-full flex items-center justify-center gap-2 bg-[#1BB6FF] hover:bg-[#2ECFC4] text-[#06101F] font-bold rounded-xl py-3.5 transition-all hover:shadow-[0_0_20px_rgba(27,182,255,0.3)] mt-4 group"
              >
                Create Account
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
  function Alertz() {
    return (
      <Modal
        open={open}
        onClose={() => {
          if (aleT) {
            setOpen(false)
            route.push('/user')
          } else {
            setOpen(false)
          }
        }}
        aria-placeholderledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack alignItems='center' justifyContent='space-evenly' sx={{
          background: '#CACACA', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500' }}>

            {aleT ? 'Success' : 'Eh Sorry!'}
          </Typography>
          <Typography id="modal-modal-description" sx={{ fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300' }}>
            {ale}
          </Typography>
          <Divider sx={{ background: '#CACACA' }} />
          <Button variant='contained' sx={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', background: '#242627', padding: '8px', width: '100%' }} onClick={() => {
            if (aleT) {
              setOpen(false)
              route.push('/user')
            } else {

              setOpen(false)
            }
          }}>Okay</Button>
        </Stack>

      </Modal>)
  }
}

export async function getServerSideProps(context) {
  const { params } = context;
  const id = params.id;
  return { props: { refer: id } }
}