import { Button, Stack, TextField,Typography } from "@mui/material";
import React, { useState ,useContext,useEffect} from "react";
import {supabase} from '../api/supabase'
import {AppContext} from '../api/Context'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
export default function Deposit() {
    //86f36a9d-c8e8-41cb-a8aa-3bbe7b66d0a5
    const [info,setInfo] = useState({});
    const [address,setAddress] = useState("")
    const [amount,setAmount] = useState("")
    //snackbar1
    const [messages,setMessages] = useState("")
    const [opened,setOpened] = useState(false)
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
      });
      useEffect(()=>{

        try{
          if (localStorage.getItem('me') === null) {
            router.push("/login")
          }else{
          const GET = async () => {
            const { data, error } = await supabase
              .from('users')
              .select()
              .eq('username', localStorage.getItem('me'))
            setInfo(data[0])
          }
          GET();
          }}catch(e){
          
          }
      },[]);
      //end of snackbar1
    const Withdrawal=async()=>{
        const { error } = await supabase
        .from('notification')
        .insert({ address: address,username:info.username, amount: amount,sent:false,type:"withdraw" })
        console.log(error)
        setAddress("")
        setAmount("")
        setMessages("Your Withdrawal Request is been Processed")
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
      function Sncks({message}){
        return(
          <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
          <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
           {message}
          </Alert>
        </Snackbar>
        )
      }
      //end of snackbar2
    return(
        <Stack spacing={3}>
             <div style={{display:'flex',justifyContent:"center"}}>
        <Typography variant="h3" align='center' style={{color:'white'}}>
          Withdrawal
        </Typography></div>
        <Typography  style={{color:'white'}}>
          Please note that the minimum withdraw is 20 USDT and maximum WithDrawal is 100USDT.
          there is a 5% fee charge on every Withdrawal.
        </Typography>
            <Sncks message={messages}/>
            <TextField variant="standard" label='Enter Your USDT Address' style={{color:"white"}}
            value={address}
            onChange={(a)=>{
                setAddress(a.target.value)
            }}
            />
            <TextField variant="standard" label='Enter the Amount you wish to Withdraw' 
            style={{color:"white",background:"#DADDD8"}}   value={amount}
            onChange={(a)=>{
                setAmount(a.target.value)
            }}/>
            <Button variant="contained" style={{color:"white"}} onClick={Withdrawal}>Withdraw</Button>
        </Stack>
    )
}