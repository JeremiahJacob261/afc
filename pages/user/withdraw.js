import { Button, Stack, TextField, Typography, MenuItem,Divider } from "@mui/material";
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
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import Modal from '@mui/material/Modal';
import Cover from './cover'
import FormControl from '@mui/material/FormControl';
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Wig from '../../public/icon/wig.png'
import Image from 'next/image'
export default function Deposit() {
  //86f36a9d-c8e8-41cb-a8aa-3bbe7b66d0a5
  const [info, setInfo] = useState({});
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [warnad, setWarnad] = useState("");
  const [warnab, setWarnab] = useState("");
  const [method, setMethod] = useState('USDT');
  const [open,setOpen] = useState(false)
  const auth = getAuth(app);
  const router = useRouter();
  const [ale,setAle] = useState('')
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false);
  const [total, setTotal] = useState(0);
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  useEffect(() => {

    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        console.log(user)
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('userId', user.uid)
          setInfo(data[0])
          console.log(data)
        }
        GET();
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });
  }, []);
  //end of snackbar1
  const wih = async (damount, dusername) => {
    const { data, error } = await supabase
      .rpc('withdrawer', { amount: damount, names: dusername })
    console.log(error);
  }
  const Withdrawal = async () => {
    if (amount < 100) {
      if (amount > 19) {
        setWarnab('')
        if (address.length < 10) {
          setWarnad('Ensure the address is correct')
        } else {
          setWarnad('')

          const { error } = await supabase
            .from('notification')
            .insert({ address: address, username: info.username, amount: total, sent: 'pending', type: "withdraw", method: method })
          console.log(error)
          setAddress("")
          setAmount("")
          setMessages("Your Withdrawal Request is been Processed")
          wih(total, info.username);
          handleClick();
        }
      } else {

        setWarnab('Please Input a value between 20 and 100 USDT')
      }
    } else {
      setWarnab('Please Input a value between 20 and 100 USDT')
    }
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
  const Alerts = (m) =>{
    setAle(m)
    setOpen(true)
  }
  //end of snackbar2
  return (
    <Cover>
      <Alertz/>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Bet History</Typography>
      </Stack>
      <Stack spacing={3} sx={{ padding: '8px' }}>
        <Sncks message={messages} />
        <Stack sx={{width:'344px',height:'110px',background:'#EFEFEF',padding:'8px',borderRadius:'5px'}} direction='column' spacing={2} justifyContent='center'>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography sx={{fontSize:'12px',fontWeight:'300',fontFamily:'Poppins,sans-serif'}}>Current Balance</Typography>
        <Typography sx={{fontSize:'14px',fontWeight:'500',fontFamily:'Poppins,sans-serif'}}>{info.balance} USDT</Typography>
        </Stack>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography sx={{fontSize:'12px',fontWeight:'300',fontFamily:'Poppins,sans-serif'}}>Charge Amount</Typography>
        <Typography sx={{fontSize:'14px',fontWeight:'500',fontFamily:'Poppins,sans-serif'}}>{(amount * 5) / 100} USDT</Typography>
        </Stack>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography sx={{fontSize:'12px',fontWeight:'300',fontFamily:'Poppins,sans-serif'}}>Total Amount</Typography>
        <Typography sx={{fontSize:'14px',fontWeight:'500',fontFamily:'Poppins,sans-serif'}}>{total} USDT</Typography>
        </Stack>
        </Stack>

        <Stack direction="column" spacing={3}>
          <Stack spacing={1}> 
            <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Enter Gpay or USDT Wallet Address</Typography>
            <TextField  sx={{color:'#03045E'}} value={address} onChange={(a) => {
              setAddress(a.target.value)
            }}/>
            </Stack>
        
            <Stack spacing={1}> 
            <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Enter Amount You Wish to Withdraw</Typography>
            <TextField 
            sx={{color:'#03045E'}}
            type="number"
            value={amount}
            onChange={(a) => {
              setAmount(a.target.value)
              setTotal(Number(a.target.value) + ((a.target.value * 5) / 100));
            }}/>
            </Stack>

            <Stack spacing={1}> 
            <Typography sx={{fontSize:'12px',color:'#03045E',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Choose Prefered Payment Method</Typography>
            <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Select your Withdrawal Method</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={method}
              style={{  background: "#FFFFFF"}}
              onChange={(e) => {
                console.log(e.target.value)
                setMethod(e.target.value);
              }}
            >
              <MenuItem value='usdt'> USDT (TRC20)</MenuItem>
              <MenuItem value='gpay'>GPAY</MenuItem>
            </Select>
          </FormControl>
            </Stack>
        <Button variant="contained" style={{ color: "white",height:'50px',background:'#03045E' }} onClick={() => {
          if (info.balance < total) {
            Alerts('Insufficient Balance');
          } else {
            
            if (address.length < 10) {
              Alerts('Ensure the address is correct');
            } else {
            Withdrawal();
            }
          }
        }}>Withdraw</Button>

        </Stack>
      </Stack>
    </Cover>
  )
  function Alertz(){
    return(
    <Modal
  open={open}
  onClose={()=>{setOpen(false)}}
  aria-labelledby="modal-modal-title"
  aria-describedby="modal-modal-description"
>
  <Stack alignItems='center' justifyContent='space-evenly' sx={{background:'white',width:'290px',height:'330px',borderRadius:'20px',
position: 'absolute',
top: '50%',
left: '50%',
transform: 'translate(-50%, -50%)',
padding:'12px'
}}>
  <Image src={Wig} width={120} height={120} alt='widh'/>
    <Typography id="modal-modal-title" sx={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:'500'}}>
     Eh Sorry!
    </Typography>
    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
     {ale}
    </Typography>
    <Divider sx={{background:'black'}}/>
    <Button sx={{color:'white',background:'#03045E',padding:'8px',width:'100%'}} onClick={()=>{
      setOpen(false)
    }}>Okay</Button>
  </Stack>
    
</Modal>)
  }

}