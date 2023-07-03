import React, { useState, useContext } from "react";
import Head from "next/head";
import Link from 'next/link'
import { Avatar, Box, Stack, OutlinedInput, Button, Typography } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';
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
import { AppContext } from "../api/Context";
import { getCookies, getCookie, setCookie, setCookies, removeCookies } from 'cookies-next';
import LOGO from '../../public/logo_afc.ico'
import Image from 'next/image'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from '../api/supabase'
export default function Register({ refer }) {
  const [password, setPassword] = useState("")
  const [cpassword, setcPassword] = useState("")
  const [phone, setPhone] = useState("")
  const { info, setInfo } = useContext(AppContext);
  const [username, setUsername] = useState("")
  const [open, setOpen] = React.useState(false);
  const [age, setAge] = useState("");
  const [idR, setidR] = useState(refer);
  const [agecheck, setAgecheck] = useState(false)
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
  const nRef = Math.random().toString().slice(2, 8);
  const updateRef = async () => {
    const { data, error } = await supabase
      .from('referral')
      .insert({ refer: nRef, count: 0 })
  }
  const updateRefb = async () => {
    const { data, error } = await supabase
      .rpc('increment', { x: 1, row_id: idR })
  }
  const signUp = async () => {
    localStorage.clear()
    if (values.password.length || password.length >= 6) {
      if (cpassword === values.password) {
        let user = username.replace(/^\s+|\s+$/gm, '')
        const { data, error } = await supabase
          .from('users')
          .insert({
            password: values.password,
            phone: phone,
            refer: idR,
            balance: 0,
            username: user,
            countrycode: age,
            newRefer: nRef
          })
          .select()
        updateRef()
        updateRefb()
        localStorage.setItem('logged',
          { "logged": true, "username": username, "phone": phone, "refer": idR, "balance": 0 });
        localStorage.setItem('me', username)
        setOpen(true);
      } else {
        alert("Please ensure the both Passwords are the Same")
      }

    } else {
      alert("The Password must have atleast 6 characters !")
    }

  }

  return (
    <Stack justifyContent="center" alignItems="center" style={{
      background: "none", maxWidth: "350px"
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

        <Stack direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          className="glass"
          sx={{ height: "100%", marginTop: "15px", padding: "10px", backgound: "#495265" }}>
          <Image src={LOGO} width='50' height='75' style={{ borderRadius: "15px" }} />
          <Typography variant="h4" style={{ fontFamily: 'Xanh Mono, monospace', color: "white" }}>Welcome 🙌 </Typography>
          <Typography variant='subtitle' sx={{ fontFamily: 'Work Sans, sans-serif', color: "white" }}>
            Sign Up now to get all the Amazing Sports Market and Odds</Typography>

          <TextField id="outlined-basic" label="Username" variant="outlined"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
            }}
            style={{ width: "100%", background: "whitesmoke" }}
          />
          <TextField id="outlined-basic" label="Invite Code" variant="outlined"
            value={idR}
            style={{ width: "100%", background: "whitesmoke" }}
            onChange={(e) => {
              setidR(e.target.value)
            }} />
          <TextField id="outlined-basic" value={age}
            label="Country"
            style={{ width: "100%", background: "whitesmoke" }}
            onChange={(e) => {
              setAge(e.target.value);
            }} />
          <Stack direction="row" sx={{ width: '42%', minWidth: "240px" }}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Code</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={age}
                label="+39"
                style={{ width: "10ch", background: "whitesmoke" }}
                onChange={(e) => {
                  setAge(e.target.value);
                }}
              >
                <MenuItem value='+39'>+39</MenuItem>
                <MenuItem value='+1'>+1</MenuItem>
                <MenuItem value='+255'>+255</MenuItem>
                <MenuItem value='+55'>+55</MenuItem>
                <MenuItem value='+52'>+52</MenuItem>
                <MenuItem value='+54'>+54</MenuItem>
                <MenuItem value='+234'>+234</MenuItem>
                <MenuItem value='+62'>+62</MenuItem>
              </Select>
            </FormControl>
            <TextField id="outlined-basic" label="Phone"
              type="phone"
              variant="outlined"
              style={{ background: "whitesmoke" }}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }} />
          </Stack>

          <Farm.Check
            type="checkbox"
            label="I agree I am 18 years old and I agree to the Terms and Conditions"
            id="age"
            value={agecheck}
            onChange={(a) => {
              setAgecheck(a.target.value)
            }}
            style={{ color: "white" }}
          />

          <FormControl sx={{ m: 1, width: '100%' }} variant="outlined">
            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              type={values.showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={handleChange('password')}
              style={{ width: "100%", background: "whitesmoke" }}
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
            style={{ width: "100%", background: "whitesmoke" }}
            value={cpassword}
            onChange={(e) => {
              setcPassword(e.target.value);
            }}
          />
          <Button variant="contained" sx={{ padding: "8px" }} onClick={() => {

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
                  signUp()
                }

              }
            }
            checkDuplicate()

          }}>
            <Typography sx={{ fontFamily: 'Zen Antique, serif', marginLeft: "3px", color: "white" }}>Sign Up</Typography>
          </Button>

          <Typography sx={{ color: "white" }}>Already have an Account ? <Link href="/login" style={{ textDecoration: "none", color: "whitesmoke" }}>Login</Link></Typography>

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
    params: { id: ref.newRefer },
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