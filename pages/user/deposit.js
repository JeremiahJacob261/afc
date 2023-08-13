import { Stack, TextField, Typography, Button, Box } from "@mui/material";
import { supabase } from '../api/supabase'
import { useContext, useEffect } from "react";
import { AppContext } from "../api/Context";
import React, { useState,useRef } from "react";
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Image from "next/image";
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import { v4 } from "uuid";
import Drawer from '@mui/material/Drawer';
import Head from 'next/head'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import barcode from '../../public/barcode.jpg'
import gpay from '../../public/simps/gpay.png'
import usdt from '../../public/simps/tether.png'
export default function Deposit() {
  let loads = 0;
  const [info, setInfo] = useState({})
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState("")
  const [amthelp, setAmthelp] = useState("")
  const [file, setfile] = useState([]);
  const [imgpath, setImgpath] = useState();
  const [imgurl, setImgurl] = useState();
  const [bottom, setBottom] = useState(false)
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false)
  const [dea, setDea] = useState("visible")
  const [deb, setDeb] = useState("hidden")
  const auth = getAuth(app);
  const [drop, setDrop] = useState(false)
  const router = useRouter()
  const [dean, setDean] = useState(200)
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  //end of snackbar1
  const isMounted = useRef(true);
  useEffect(() => {
    const useri =  localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid =  localStorage.getItem('signUid');
      const name =  localStorage.getItem('signName');
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
       
        // ...
        if (isMounted.current) {
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username',name)
          setInfo(data[0])
          console.log(data)
        }
        GET();
        isMounted.current = false;
      }else{

      }
      } else {
        // User is signed out
        // ...
        signOut(auth);
        console.log('sign out');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        router.push('/login');
      }
  
   
  }, []);
  //file upload


  const handleSubmit = async (e) => {
    e.preventDefault();
    // upload image
    if (file.length === 0) {

      alert('please select an image');
    } else {
      console.log(file[0])
      const { data, error } = await supabase
        .storage
        .from('trcreceipt')
        .upload(`public/${v4() + file[0].name}`, file[0], {
          cacheControl: '3600',
          upsert: false
        })
      setImgpath(data.path);
      let imga = data.path;
      console.log(data);
      const checkDepo = async (url) => {
        const { error } = await supabase
          .from('notification')
          .insert({ address: url, username: info.username, amount: amount, sent: 'pending', type: "deposit" })
        setAddress("")
        setAmount("")
        setMessages("The Deposit will reflect in your balance soon")
        handleClick();
        console.log(error)
      }
      const getUrl = async () => {
        const { data, error } = await supabase
          .storage
          .from('trcreceipt')
          .getPublicUrl(imga);
        setImgurl(data.publicUrl);
        console.log(data.publicUrl);
        console.log(error)
        checkDepo(data.publicUrl);
      }
      getUrl();
      setfile([]);
      setDea('visible')
      setDeb('hidden')
      setDrop(false)
    }
  };

  //end fileupload
  //snackbar2
  const handleClick = () => {
    setOpened(true);
  };

  const handleClosed = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpened(false);
  };
  function Sncks({ message }) {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
        <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    )
  }
  //end of snackbar2
  return (
    <div style={{ minHeight: '80vh' }}>
      <Drawer
        anchor='bottom'
        open={bottom}
        onClose={() => {
          setBottom(false)
        }}
        style={{ background: '#1A1B72', padding: '8px' }}
      >
        <Stack style={{ background: '#1A1B72', padding: '8px', }} direction="column" alignItems='center'>
          <CloseIcon style={{ color: '#EE8F00', margin: '12px', width: '30px', height: '30px' }}
            onClick={() => {
              setBottom(false)
            }}
          />
          <div style={{ display: 'flex', justifyContent: "center", padding: '5px', background: '#1A1B72' }}>

            <Typography align='center' style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '30px' }}>
              Deposit
            </Typography></div>
          <Typography style={{ color: 'white' }}>
            Please note that the minimum deposit is 10 USDT
          </Typography>
          <Stack
            direction="column" spacing={3}
            sx={{
              visibility: dea,
              height: dean,
              background: '#1A1B72'
            }}>
            <TextField variant="standard"
              label="Enter Amount You Wish To Deposit"
              value={amount}
              type="number"
              onChange={(a) => {
                setAmount(a.target.value)
              }}
              helperText={amthelp}
              sx={{
                background: "whitesmoke"
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                if (amount < 10 || amount.length < 1) {
                  setAmthelp("The Minimum Deposit is 10 USDT")
                } else {
                  setDea('hidden')
                  setDeb('visible')
                  setDean(0)
                }

              }}>Next</Button>
          </Stack>
          <Stack direction="column" spacing={3} sx={{
            visibility: deb,
          }}>
            <Typography style={{ color: "whitesmoke" }}>ADDRESS NETWORK: TRC20</Typography>
            <Typography style={{ color: "whitesmoke" }}>Send Your USDT to this Address :  </Typography>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image src={barcode} width={200} height={200} alt='TRC20 Address' style={{ padding: '12px', background: 'whitesmoke', borderRadius: '5px' }}
              /></div>
            <Typography style={{ color: "black", background: "whitesmoke", padding: "4px", cursor: "pointer" }} onClick={() => {
              navigator.clipboard.writeText("TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o")
              setMessages("Address Copied")
              handleClick();
            }}>TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o</Typography>

            <Typography variant="caption" sx={{ color: "whitesmoke" }}>Click the Address to Copy</Typography>
            <Typography variant="caption" sx={{ color: "#FFE74C" }}>The Minimum Deposit is 10 USDT ,
              Deposits less than 10 USDT will be ignored.
              After making the Transaction, Please upload a screenshot of the successful Transaction.
            </Typography>
            <form onSubmit={handleSubmit}>
              <input type="file" name="image" accept="image/*" onChange={(e) => {
                setfile(e.target.files);
              }} />
              <Button variant='contained' type='submit' style={{ color: "white" }} onClick={() => {
                setDrop(true)
              }}>Verify Transaction</Button>
            </form>

            <Typography variant="caption" style={{ color: "white" }} >Click this Button within 20Mins after depositing to Verify.
              Failure To Verify the Transaction will result in Lost Funds</Typography>
          </Stack>
        </Stack>

      </Drawer>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Head>
        <title>Deposit</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Sncks message={messages} />
      <Stack direction="column" spacing={3} alignItems="center">
        <CloseIcon style={{ color: 'white', margin: '12px', width: '50px', height: '50px' }}
          onClick={() => {
            router.push('/user/account')
          }}
        />
        <Stack>
          <div style={{ display: 'flex', justifyContent: "center", padding: '5px' }}>

            <Typography align='center' style={{ color: '#181AA9', fontFamily: 'Poppins, sans-serif', fontSize: '36px', fontWeight: 'bold' }}>
              DEPOSIT
            </Typography></div>
          <Typography align='center' style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}>
            Choose Preferred Payment Method
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent='space-around' spacing={4}>
          <Button onClick={() => {
            setBottom(true)
          }}
            sx={{ background: '#1A1B72', width: '145px', height: '136px', borderRadius: '5px' }}
          >
            <Stack direction="column" spacing={2} justifyContent="center" alignItems='center'>

              <Image src={usdt} alt='usdt' width={90} height={70} />
              <Typography sx={{ color: 'white' }}>
                USDT
              </Typography>
            </Stack>
          </Button>

          <Button 
            sx={{ background: '#1A1B72', width: '145px', height: '136px', borderRadius: '5px' }}
          >
            <Stack direction="column" spacing={2} justifyContent="center" alignItems='center'>

              <Image src={gpay} alt='gpay' width={60} height={60} />
              <Typography sx={{ color: 'white' }}>
                Gpay
              </Typography>
            </Stack>
          </Button>
        </Stack>

        <Typography
          variant="caption"
          sx={{ color: '#DFA100' }}
        >
          GPay is currently unavailable at the moment
        </Typography>
      </Stack>
    </div>
  )
}
