import React, { useState, useContext, useEffect } from "react";
import Head from "next/head";
import Link from 'next/link'
import { Modal, Box, Stack, OutlinedInput, Button, Typography, Divider } from "@mui/material";
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
import LOGO from '../../public/brentford.ico'
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
    const { data, error } = await supabase
      .rpc('increment', { x: 1, row_id: idR })
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
    // let usern = username.replace(/^\s+|\s+$/gm, '')
    // createUserWithEmailAndPassword(auth, email, values.password)
    //   .then((userCredential) => {
    //     // Signed in 
    //     const user = userCredential.user;
    //     // ...
    //     console.log(user.uid);

    //     const upload = async () => {

    //       console.log(nRef)
    //       const { data, error } = await supabase
    //         .from('users')
    //         .insert({
    //           userId: user.uid,
    //           password: values.password,
    //           phone: phone,
    //           refer: refer,
    //           username: username,
    //           countrycode: age,
    //           newrefer: nRef,
    //           lvla: lvla,
    //           lvlb: lvlb,
    //           email: email,
    //         })
    //       console.log(error);
    //       console.log(data);
    //       localStorage.setItem('signedIns', true);
    //       localStorage.setItem('signUids', user.uid);
    //       localStorage.setItem('signNames', user.displayName);
    //       localStorage.setItem('signRef', nRef);
    //     }
    //     //getlvl2
    //     upload();
    //     updateRef();
    //     updateRefb();
    //     setDrop(false);
    //     updateProfile(auth.currentUser, {
    //       displayName: username,
    //       phoneNumber: phone
    //     }).then(async () => {

    //     })

    //     setOpen(true);
    //   })
    //   .catch((error) => {
    //     const errorCode = error.code;
    //     const errorMessage = error.message;
    //     // ..
    //     console.log(error.code);
    //     setDrop(false);
    //     if (errorCode === 'auth/email-already-in-use') {

    //       alert('this email is already registered')
    //     } else if (errorCode === 'auth/weak-password') {
    //       alert('Your password is weak, please use atleast 6 characters')
    //     }
    //   });
    const upload = async (user) => {

      try {
        console.log(nRef)
        const { data, error } = await supabase
          .from('users')
          .insert({
            userId: user.id,
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
        
       

        const messageResponse = await fetch('https://telegram-iota-black.vercel.app/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "topic": "SIGN IN Detected 😶",
            "message": `${username} signed in to their account.\n\n`
          })
        });

        console.log(messageResponse)
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
          setDrop(false);
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
    <Stack justifyContent="center" alignItems="center"
      spacing={5}
      style={{
        background: "#0B122C", width: '100%', minHeight: '100vh'
      }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
      </Backdrop>
      <Alertz />
      <Head>
        <title>Register</title>
        <meta name="description" content="Register With us to get the latest betting market and fantantic Bonus" />
        <link rel="icon" href="/brentford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box >

        <Stack spacing={5} sx={{ padding: '8px' }}>
          <Stack direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            className="glass"
            sx={{ height: "100%", marginTop: "15px",minWidth:'345px',maxWidth:'450px', padding: "10px", backgound: "#495265" }}>
            <Stack direction="column" spacing={4} justifyContent="center" alignItems="center">
              <Link href="/" style={{ textDecoration: "none" }}>
                <Typography style={{ fontFamily: 'Noto Serif, serif', color: "#CACACA", fontWeight: '400', fontSize: '20px' }}>BFC  </Typography>
              </Link>
              <Typography style={{ fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '25px', fontWeight: '400', width: '240px', textAlign: 'center' }}>
                Sign up now and get a free USDT to invest!
              </Typography>
              <Typography style={{ opacity: '0.7', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100', width: '292px', textAlign: 'center' }}>
                Enter the correct information provided to create an account
              </Typography>
            </Stack>

            <TextField placeholder="Username" variant="outlined"

              sx={{ padding: 0, fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }}

              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
              }}
            />
            <TextField id="outlined-basic" placeholder="Email" variant="outlined"
              sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                style: {
                  color: '#CACACA', // Change the color to red
                },
              }}
              value={email}
              type='email'
              onChange={(e) => {
                setEmail(e.target.value)
              }}
            />
            <TextField id="outlined-basic" placeholder="Invite Code" variant="outlined"
              value={idR}
              disabled
              sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", color: '#CACACA', background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                style: {
                  color: '#CACACA', // Change the color to red
                },
              }}
              onChange={(e) => {
                setidR(e.target.value)
              }} />
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-placeholder">Code</InputLabel>
              <Select
                placeholderId="demo-simple-select-placeholder"
                id="demo-simple-select"
                value={age}
                placeholder="+91"
                sx={{ fontSize: '14', color: '#CACACA', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                  style: {
                    color: '#CACACA', // Change the color to red
                  },
                }}
                onChange={(e) => {
                  setAge(e.target.value);
                }}
              >

                {
                  codes.countries.map((c) => {
                    return (
                      <MenuItem value={c.code} key={c.name} sx={{ color: '#CACACA', background: '#172242' }}>
                        <Stack direction='row' spacing={1}>
                          <Image src={c.flag_image_link} alt={c.name} width={25} height={22} />
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif' }}> {c.code} {c.name}</Typography>
                        </Stack>
                      </MenuItem>
                    )
                  })
                }
                {/* {<MenuItem value='+1'>+1</MenuItem>
                <MenuItem value='+255'>+255</MenuItem>
                <MenuItem value='+55'>+55</MenuItem>
                <MenuItem value='+52'>+52</MenuItem>
                <MenuItem value='+54'>+54</MenuItem>
                <MenuItem value='+234'>+234</MenuItem>
                <MenuItem value='+62'>+62</MenuItem> */
                }

              </Select>
            </FormControl>
            <TextField id="outlined-basic" placeholder="Phone"
              type="number"
              variant="outlined"
              sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', color: '#CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                style: {
                  color: '#CACACA', // Change the color to red
                },
              }}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }} />

            <FormControl sx={{ m: 1, width: '100%' }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={values.showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange('password')}
                sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                  style: {
                    color: '#CACACA', // Change the color to red
                  },
                }}
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
                placeholder="Enter Password"
              />
            </FormControl>
            <TextField
              required
              id="outlined-required"
              placeholder="Confirm Password"
              type="password"
              sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif', width: "100%", background: '#172242', input: { color: '#FFFFFF' } }} InputLabelProps={{
                style: {
                  color: '#CACACA', // Change the color to red
                },
              }}
              value={cpassword}
              onChange={(e) => {
                setcPassword(e.target.value);
              }}
            />
          </Stack>
          <Stack spacing={3} sx={{ margin: '8px', padding: '8px' }}>
            <Farm.Check
              type="checkbox"
              label="Do you accept our Terms and Conditions ?"
              id="age"
              sx={{ fontSize: '14', fontWeight: '300', border: '1px solid #CACACA', borderRadius: '4px', fontFamily: 'Poppins, sans-serif' }}
              value={agecheck}
              onChange={(a) => {
                setAgecheck(a.target.value)
              }}
              style={{ color: "#CACACA" }}
            />
            <Button variant="contained" sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', background: '#FE9D16' }}
              onClick={() => {
                if (phone.length >= 9) {

                  const checkDuplicate = async () => {
                    const { count, error } = await supabase
                      .from('users')
                      .select('*', { count: 'exact', head: true })
                      .eq('username', username)
                    console.log(count);
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
              <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: '#242627', fontSize: '14px', color: '#CACACA' }}>Register</Typography>
            </Button>
            <Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: '22px' }} spacing={1}>
              <Typography sx={{ color: "#CACACA", fontSize: '14px', fontWeight: '100', opacity: '0.7', fontFamily: 'Poppins,sans-serif' }}>Already have an Account ? </Typography>
              <Typography>
                <Link href="/login" style={{ textDecoration: "none", fontSize: '14px', fontWeight: '100', color: "#CACACA", opacity: '1.0', fontFamily: 'Poppins,sans-serif' }}>Login</Link></Typography>

            </Stack>
          </Stack>


        </Stack>
      </Box>
    </Stack>
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