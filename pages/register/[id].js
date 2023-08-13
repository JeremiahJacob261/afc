import React, { useState, useContext, useEffect } from "react";
import Head from "next/head";
import Link from 'next/link'
import { Avatar, Box, Stack, OutlinedInput, Button, Typography } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';
import { useRouter } from 'next/router'
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { getDocs, collection } from "firebase/firestore";
import { db } from '../api/firebase'
import Spinner from 'react-bootstrap/Spinner';
import { Form as Farm } from 'react-bootstrap'
import SimpleDialog from '../modal'
import { getCookies, getCookie, setCookie, setCookies, removeCookies } from 'cookies-next';
import LOGO from '../../public/logo_afc.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '../api/supabase'
import { app } from '../api/firebase'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "firebase/auth";
import { async } from "@firebase/util";
import codes from '../api/codes.json'
export default function Register({ refer }) {
  const [password, setPassword] = useState("")
  const [cpassword, setcPassword] = useState("")
  const route = useRouter();
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [open, setOpen] = React.useState(false);
  const [age, setAge] = useState("+91");
  const [drop, setDrop] = useState(false);
  const [idR, setidR] = useState(refer);
  const [agecheck, setAgecheck] = useState(false);
  const [lvla, setLvla] = useState('');
  const [lvlb, setLvlb] = useState('');
  const [email, setEmail] = useState('')
  const auth = getAuth(app);
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
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        console.log(localStorage.getItem('signInfo'))
        localStorage.setItem('signedIn',true);
        localStorage.setItem('signUid',uid);
        localStorage.setItem('signName',user.displayName);
        route.push('/user');
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
      }
    });

  }, [idR])

  const signup = async () => {

    let usern = username.replace(/^\s+|\s+$/gm, '')
    createUserWithEmailAndPassword(auth, email, values.password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        // ...
        console.log(user.uid);
        const lvls=async()=> {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('newrefer', idR)
          console.log(data);
          console.log(refer);
          let lvlas = data[0].refer;
          let lvlbs = data[0].lvla;
            upload(lvlas,lvlbs)
    }
        lvls();
        const upload = async (lvlas,lvlbs) => {

          const nRef = generateRandomSevenDigitNumber().toString();
          console.log(nRef)
          const { data, error } = await supabase
            .from('users')
            .insert({
              userId: user.uid,
              password: values.password,
              phone: phone,
              refer: idR,
              username: username,
              countrycode: age,
              newrefer: nRef,
              lvla: lvlas,
              lvlb: lvlbs,
              email: email
            })
          console.log(error);
          console.log(data);
        }
         //getlvl2

        updateRef()
        updateRefb()
        setDrop(false);
        updateProfile(auth.currentUser, {
          displayName: username,
          phoneNumber: phone
        }).then(async () => {

        })

        setOpen(true);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
        console.log(error.code);
        setDrop(false);
        if (errorCode === 'auth/email-already-in-use') {

          alert('this email is already registered')
        } else if (errorCode === 'auth/weak-password') {
          alert('Your password is weak, please use atleast 6 characters')
        }
      });
  }


  return (
    <Stack justifyContent="center" alignItems="center" style={{
      background: "none", width: '100%'
    }}>
      <Head>
        <title>Register</title>
        <meta name="description" content="Register With us to get the latest betting market and fantantic Bonus" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box >
        <SimpleDialog
          open={open}
          onClose={handleClose}
        />
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={drop}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Stack direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          className="glass"
          sx={{ height: "100%", marginTop: "15px", padding: "10px", backgound: "#495265" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography variant="h1" style={{ fontFamily: 'Poppins, sans-serif', color: "#181AA9", fontWeight: '900', fontSize: '64px' }}>AFCFIFA </Typography>

          </Link>
          <Typography variant='subtitle' sx={{ fontFamily: 'Poppins, sans-serif', fontSize: "15px", color: "#181AA9" }}>
            Investment Bet</Typography>
          <TextField id="outlined-basic" label="Username" variant="outlined"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
            }}
            style={{ width: "100%", background: "#F2F4CB" }}
          />
          <TextField id="outlined-basic" label="Email" variant="outlined"
            value={email}
            type='email'
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            style={{ width: "100%", background: "#F2F4CB" }}
          />
          <TextField id="outlined-basic" label="Invite Code" variant="outlined"
            value={idR}
            style={{ width: "100%", background: "#F2F4CB" }}
            onChange={(e) => {
              setidR(e.target.value)
            }} />
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Code</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={age}
              label="+91"
              style={{ width: '100%', background: "#F2F4CB" }}
              onChange={(e) => {
                setAge(e.target.value);
              }}
            >

              {
                codes.countries.map((c) => {
                  return (
                    <MenuItem value={c.code} key={c.name}>{c.code} {c.name}</MenuItem>
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
          <TextField id="outlined-basic" label="Phone"
            type="number"
            variant="outlined"
            style={{ width: '100%', background: "#F2F4CB", }}
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
              style={{ width: "100%", background: "#F2F4CB" }}
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
          <TextField
            required
            id="outlined-required"
            label="Confirm Password"
            type="password"
            style={{ width: "100%", background: "#F2F4CB" }}
            value={cpassword}
            onChange={(e) => {
              setcPassword(e.target.value);
            }}
          />

          <Farm.Check
            type="checkbox"
            label="Do you accept our Terms and Conditions ?"
            id="age"
            value={agecheck}
            onChange={(a) => {
              setAgecheck(a.target.value)
            }}
            style={{ color: "white" }}
          />
          <Button variant="contained" sx={{ padding: "10px", width: '100%', background: '#EE8F00' }} onClick={() => {
            if (phone.length >= 9) {

              const checkDuplicate = async () => {
                const { count, error } = await supabase
                  .from('users')
                  .select('*', { count: 'exact', head: true })
                  .eq('username', username)
                console.log(count);
                if (count > 0) {
                  alert("Username Already Exist!");
                } else {
                  if (agecheck === false) {
                    alert('Please click the checkBox before you continue')
                  } else {
                    setDrop(true);
                    signup()
                  }

                }
              }
              checkDuplicate()

            } else {
              alert('Please Input a Complete Phone Number! at least 9 digits')
            }
          }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', marginLeft: "3px", color: '#03045E' }}>Sign Up</Typography>
          </Button>

          <Typography sx={{ color: "#EE8F00" }}>Already have an Account ? <Link href="/login" style={{ textDecoration: "none", color: "whitesmoke" }}>Login</Link></Typography>

        </Stack>
      </Box>
    </Stack>
  )
}
export async function getStaticPaths() {
  const { data, error } = await supabase
    .from('users')
    .select()
  const paths = data.map((ref) => ({
    params: { id: ref.newrefer },
  }))
  return { paths, fallback: true }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  let refer = params.id;

  // Pass post data to the page via props
  return { props: { refer } }
}
