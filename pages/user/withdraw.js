import { Button, Stack, TextField, Typography } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { supabase } from '../api/supabase'
import { AppContext } from '../api/Context'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
export default function Deposit() {
  //86f36a9d-c8e8-41cb-a8aa-3bbe7b66d0a5
  const [info, setInfo] = useState({});
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [warnad, setWarnad] = useState("");
  const [warnab, setWarnab] = useState("");
  const auth = getAuth(app);
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
  },[]);
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
              .insert({ address: address, username: info.username, amount: total, sent: 'pending', type: "withdraw" })
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
    //end of snackbar2
    return (
      <Stack spacing={3}>
        <div style={{ display: 'flex', justifyContent: "center" }}>
          <Typography variant="h4" align='center' style={{ color: 'white', fontFamily: 'Poppins, sans-serif' }}>
            Withdrawal
          </Typography></div>
        <Typography style={{ color: 'white', fontFamily: 'Poppins, sans-serif' }}>
          Please note that the minimum withdraw is 20 USDT,
          there is a 5% fee charge on every Withdrawal.
        </Typography>
        <Sncks message={messages} />
        <Typography style={{ color: '#DBE9EE', fontFamily: 'Poppins, sans-serif' }}>Requested Amount : {amount} USDT</Typography>
        <Typography style={{ color: '#DBE9EE', fontFamily: 'Poppins, sans-serif' }}>Charge Amount : {(amount * 5) / 100} USDT</Typography>
        <Typography style={{ color: '#DBE9EE', fontFamily: 'Poppins, sans-serif' }}>Total : {total} USDT</Typography>
        <Typography style={{ color: '#DBE9EE', fontFamily: 'Poppins, sans-serif' }}>Available Account Balance : {info.balance} USDT</Typography>
        <div style={{ display: 'grid', justifyContent: 'center', minWidth: '300px' }}>
          <TextField variant="standard" label='Enter Your USDT Address'
            style={{ color: "white", minWidth: '300px' }}
            value={address}
            helperText={warnad}
            onChange={(a) => {
              setAddress(a.target.value)
              if (address.length < 10) {
                setWarnad('Ensure the address is correct')
              } else {
                setWarnad('')
              }
            }}
          />
          <TextField variant="standard" label='Enter the Amount you wish to Withdraw'
            helperText={warnab}
            style={{ color: "white", background: "#DADDD8", minWidth: '300px' }}
            type="number"
            value={amount}
            onChange={(a) => {
              setAmount(a.target.value)
              setTotal(Number(a.target.value) + ((a.target.value * 5) / 100));
            }} /></div>

        <Button variant="contained" style={{ color: "white" }} onClick={() => {
          if (info.balance < total) {
            alert('Insufficient Balance')
          } else {

            Withdrawal();
          }
        }}>Withdraw</Button>
      </Stack>
    )
  }
