import { Stack, TextField, Typography, Button, Box } from "@mui/material";
import { supabase } from '../api/supabase'
import { useContext } from "react";
import { AppContext } from "../api/Context";
import React, { useState } from "react";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
export default function Deposit() {
  const { info, setInfo } = useContext(AppContext)
  const [amount, setAmount] = useState(0)
  const [address, setAddress] = useState("")
  const [amthelp, setAmthelp] = useState("")
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false)
  const [dea, setDea] = useState("visible")
  const [deb, setDeb] = useState("hidden")

  const [dean, setDean] = useState(200)
  const [debn, setDebn] = useState(0)
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  //end of snackbar1

  const checkDepo = async () => {
    const { error } = await supabase
      .from('notification')
      .insert({ address: address, username: info.username, amount: amount, sent: false, type: "deposit" })
    setAddress("")
    setAmount("")
    setMessages("The Deposit will reflect in your balance soon")
    handleClick();
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
    <div>
      <Sncks message={messages} />
      <Stack direction="column" spacing={3}>
        <div style={{display:'flex',justifyContent:"center"}}>
        <Typography variant="h3" align='center'  style={{color:'white'}}>
          Deposit
        </Typography></div>
        <Typography  style={{color:'white'}}>
          Please note that the minimum deposit is 10 USDT
        </Typography>
        <Stack
          direction="column" spacing={3}
          sx={{
            visibility: dea,
            height:dean
          }}>
          <TextField variant="standard"
            label="Enter Amount You Wish To Deposit"
            value={amount}
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
              if (amount < 10) {
                setAmthelp("The Minimum Deposit is 10 USDT")
              } else {
                setDea('hidden')
                setDeb('visible')
                setDean(0)
                setDebn(400)
              }

            }}>Next</Button>
        </Stack>
        <Stack direction="column" spacing={3} sx={{
          visibility: deb,
          height:debn
        }}>
                 <Typography style={{color:"whitesmoke"}}>ADDRESS NETWORK: TRC20</Typography>
          <Typography  style={{color:"whitesmoke"}}>Send Your USDT to this Address :  </Typography>
          <Typography style={{ color: "black", background: "whitesmoke", padding: "4px", cursor: "pointer" }} onClick={() => {
            navigator.clipboard.writeText("TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o")
            setMessages("Address Copied")
            handleClick();
          }}>TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o</Typography>

          <Typography variant="caption" sx={{ color: "whitesmoke" }}>Click the Address to Copy</Typography>
          <Typography variant="caption" sx={{ color: "#FFE74C" }}>The Minimum Deposit is 10 USDT ,
            Deposits less than 10 USDT will be ignored.
          </Typography>

          <TextField variant="standard" label="Your USDT Address"
            value={address}
            onChange={(a) => {
              setAddress(a.target.value)
            }}
          />
          <Button variant='contained' style={{ color: "white" }} onClick={() => {
            checkDepo()
            setDea('visible')
            setDeb('hidden')

          }}>Verify Transaction</Button>
          <Typography variant="caption" style={{ color: "white" }} >Click this Button within 20Mins after depositing to Verify.
            Failure To Verify the Transaction will result in Lost Funds</Typography>
        </Stack>
      </Stack>
    </div>
  )
}