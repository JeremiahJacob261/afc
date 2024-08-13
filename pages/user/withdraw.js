import { Button, Stack, TextField, Typography, MenuItem, Divider } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { supabase } from '../api/supabase'
import { AppContext } from '../api/Context'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { Icon } from '@iconify/react'
import Head from "next/head";
import Modal from '@mui/material/Modal';
import Cover from './cover'
import toast, { Toaster} from 'react-hot-toast'
import Loading from "@/pages/components/loading";
import FormControl from '@mui/material/FormControl';
import { motion } from 'framer-motion'
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Wig from '../../public/icon/wig.png'
import Image from 'next/image'
import Big from '../../public/icon/badge.png'
import { DriveFileRenameOutlineRounded } from "@mui/icons-material";
export default function Deposit() {
  const [wallx,setWallx] = useState([]);
  const getwallx = async () => {
    const { data: wallets, error: walleterror } = await supabase
      .from('walle')
      .select('*')
      .eq('available', true);
      setWallx(wallets)
  }
  getwallx()
  //86f36a9d-c8e8-41cb-a8aa-3bbe7b66d0a5
  function findObjectById(id) {
    return wallx.find(obj => obj.name === id);
  }

  
  let amountlimit = {
    '1': 20,
    '2': 50,
    '3': 100,
    '4': 200,
    '5': 300,
    '6': 500,
    '7': 1000
}

  const [wallets, setWallet] = useState([]);
  const [info, setInfo] = useState({});
  const [rate,setRate] = useState(1);
  const [currency,setCurrency] = useState({});
  const [swallet,setSWallet] = useState({});

  //the below controls the loading modal
  const [openx, setOpenx] = useState(false);
  const handleOpenx = () => setOpenx(true);
  const handleClosex = () => setOpenx(false);

  //the end of thellaoding modal control
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(0);
  const [pin, setPin] = useState("");
  const [warnad, setWarnad] = useState("");
  const [warnab, setWarnab] = useState("");
  const [method, setMethod] = useState('');
  const [open, setOpen] = useState(false)
  const auth = getAuth(app);
  const router = useRouter();
  const [ale, setAle] = useState('')
  const [aleT, setAleT] = useState(false)
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false);
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  //serach
  function findObjectByWallet(id) {
    return wallets.find(obj => obj.wallet === id);
  }

  const getVip = async () => {
    let test = await fetch('/api/vipcalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'username': localStorage.getItem('signNames') })
    }).then(data => {
      return data.json();
    })
    return test;
  }

  const testRoute = () => {
    const aayncer = async () => {
      try {
        getVip().then(async (data) => {
          let viplevel = data.viplevel;
          //this sends data to the withdraw in backend


          let test = await fetch('/api/withdraw', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            //space here: crypto address for crypto , account number fro local banks
            body: JSON.stringify({
              name: info.username, pass: pin, wallet: address, amount: parseFloat(amount).toFixed(3), method: currency.currency_code,
              "bank": currency.bank, "accountname": swallet['names'], vipamount: amountlimit[viplevel]
            })
          }).then(data => {

            return data.json();
          })
          console.log(test);
          if (test[0].status === 'Failed') {
            toast.error(test[0].message);
            if (test[0].message === 'No transaction pin has been set') {
              toast.error(test[0].message)
              router.push('/user/codesetting')
             
            }
          } else {

            router.push('/user/withdrawsuccess')
            
          }
        })
      } catch (e) {
        console.log(e);
        handleClosex();
      }


    }
    aayncer();

  }
  const transaction = () => {

    if (pin === '') {
      toast.error('Please enter your password')
    } else if (pin === '') {
      toast.error('Please confirm your password')
    } else if (pin !== pin) {
      toast.error('Password does not match')
    } else if (amount === '') {
      toast.error('Please enter amount')
    } else if (amount < 10) {
      toast.error(`Minimum amount to withdraw is 10 USDT`)

    } else if (amount > 100) {
      toast.error(`Maximum amount to withdraw including charges is 100 USDT`)

    } else {

      handleOpenx()
      testRoute();
    }
  }

  useEffect(() => {
    
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      // ...
      const GET = async () => {

        const names = localStorage.getItem('signNames');
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', names)

          //get the wallets
          const { data: wall, error: wrr } = await supabase
            .from('user_wallets')
            .select()
            .eq('uid', data[0].userId)
          setWallet(wall ?? []);

          setInfo(data[0]);
          setBalance(data[0].balance);
          localStorage.setItem('signRef', data[0].newrefer);
        } catch (e) {
          console.log(e)
          toast.error('Please Check your Internet Connection and Refresh the Website')
        }

      }
      GET();


    }
  }, []);
  //end of snackbar1

  const Withdrawal = async () => {

  }
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
  const Alerts = (m, t) => {
    setAle(m)
    setAleT(t)
    setOpen(true)
  }
  //end of snackbar2
  let charge = (amount * 5) / 100;
  let total = Number(amount) + ((amount * 5) / 100);
  return (
    <Cover style={{ minHeight: '95vh', paddingBottom: '100px' }}>
      <Head>
        <title>Withdraw</title>
      </Head>
      <Alertz />
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white' }}>WITHDRAW</Typography>
      </Stack>
      <Stack spacing={3} sx={{ padding: '8px', marginBottom: '100px' }} >
        <Sncks message={messages} />
        <Stack sx={{ minWidth: '350px', minHeight: '110px', background: '#373636', padding: '8px', borderRadius: '5px' }} direction='column' spacing={2} justifyContent='center'>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Current Balance</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{(info.balance) ? info.balance.toFixed(3) : info.balance} USDT</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Charge Amount</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{(charge) ? charge.toFixed(3) : charge} USDT</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Total Amount</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{total} USDT</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Total Amount in {(currency.currency_code  ?? "USDT").toUpperCase()}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>{parseFloat(total * rate).toFixed(2)} {(currency.currency_code ?? "USDT").toUpperCase()}</Typography>
          </Stack>
          <Divider sx={{ color: 'white' }} />
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.9 }}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleOpenx()
              router.push('/user/bindwallet')
            }}
          >
            <Stack direction='row' spacing={1} justifyContent='center' alignItems={"center"} sx={{ background: '#242627', padding: '8px', borderRadius: '8px' }}

            >
              <Icon icon="icon-park-twotone:add" width="24" height="24" style={{ color: '#a3a3a3' }} />

              <Typography sx={{ color: '#CACACA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>Bind Wallet</Typography>
            </Stack>
          </motion.div>

        </Stack>

        <Stack direction="column" spacing={3}>

          <Stack spacing={1} >
            <Typography sx={{ fontSize: '12px', color: '#242627', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Choose Prefered Payment Wallet</Typography>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Select your Withdrawal Method</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={method}
                style={{ background: "#242627", color: '#CACACA', border: '1px solid #CACACA' }}
                onChange={(e) => {
                try{
                  console.log(e.target.value);
                  const [w, b, t] = e.target.value.split('-');
                  setAddress(w);
                  let selectx = findObjectByWallet(w);
                  setSWallet(selectx)
                  console.log(selectx)
                  let current = findObjectById(b);
                  setRate(current.rates);
                  setMethod(b);
                  setCurrency(current);
                }catch(e){
                  console.log(e)
                  
                }finally{
                  setMethod(e.target.value);
                }
                }}
              >
                <MenuItem value=''>none</MenuItem>
                {
                  wallets.map((w) => {
                    return <MenuItem value={w.wallet + '-' + w.bank} key={w.id}>{w.wallet} {w.bank}</MenuItem>
                  })
                }

              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Enter Amount You Wish to Withdraw in USD</Typography>
            <TextField
              sx={{ border: '1px solid #CACACA', input: { color: '#CACACA', } }}
              type="number"
              value={amount}
              onChange={(a) => {
                setAmount(a.target.value)

              }} />
          </Stack>
          <Stack spacing={1}>
            <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#CACACA' }}>Transaction Pin</Typography>
            <TextField
              sx={{ border: '1px solid #CACACA', input: { color: '#CACACA', }, textAlign: 'center' }}
              type="pin"
              value={pin}
              onChange={(a) => {
                if (!isNaN(a.target.value)) {
                  setPin(a.target.value)
                }
              }} />
          </Stack>


          <motion.div whileTap={{ scale: 0.98 }}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: "#CACACA", height: '50px', background: '#E94E55', minWidth: '310px', padding: '12px' }}
            onClick={transaction}>Withdraw</motion.div>

        </Stack>
      </Stack>
      <Loading open={openx} handleClose={handleClosex} />
      <Toaster position="bottom-center"
        reverseOrder={false} />
    </Cover>
  )
  function Alertz() {
    return (
      <Modal
        open={open}
        onClose={() => {
          if (aleT) {
            setOpen(false)
            router.push('/user/withdrawsuccess')
          } else {
            setOpen(false)
          }
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack alignItems='center' justifyContent='space-evenly' sx={{
          background: '#242627', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#cacaca' }}>

            {aleT ? 'Success' : 'Eh Sorry!'}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: '14px', fontWeight: '300', color: '#cacaca' }}>
            {ale}
          </Typography>
          <Divider sx={{ background: '#CACACA' }} />
          <Button variant='contained' sx={{ fontFamily: 'Poppins,sans-serif', color: '#cacaca', background: '#E94E55', padding: '8px', width: '100%' }} onClick={() => {
            if (aleT) {
              setOpen(false)
              router.push('/user/withdrawsuccess')
            } else {
              setOpen(false)
            }
          }}>Okay</Button>
        </Stack>

      </Modal>)
  }

}


// export const getServerSideProps = async (context) => {

//   try {
    
//     return {
//       props: { wallx: wallets }
//     }
//   } catch (e) {
//     return {
//       props: { wallx: [] }
//     }
//   }


// }