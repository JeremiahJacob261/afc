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
    const [warnad,setWarnad] = useState("");
    const [warnab,setWarnab] = useState("");
    //snackbar1
    const [messages,setMessages] = useState("")
    const [opened,setOpened] = useState(false);
    const [total,setTotal] = useState(Number(amount)+((amount*5)/100));
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
      if(amount < 100 ){
       if(amount > 19){
        setWarnab('')
        if(address.length < 10){
          setWarnad('invalid address')
            }else{
          setWarnad('')

        const { error } = await supabase
        .from('notification')
        .insert({ address: address,username:info.username, amount: total,sent:'pending',type:"withdraw" })
        console.log(error)
        setAddress("")
        setAmount("")
        setMessages("Your Withdrawal Request is been Processed")
        handleClick();
            }
       }else{

        setWarnab('Please Input a value between 20 and 100 USDT')
       }
          }else{
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
        <Typography variant="h4" align='center' style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>
          Withdrawal
        </Typography></div>
        <Typography  style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>
          Please note that the minimum withdraw is 20 USDT,
          there is a 5% fee charge on every Withdrawal.
        </Typography>
            <Sncks message={messages}/>
            <Typography style={{color:'#DBE9EE',fontFamily: 'Poppins, sans-serif'}}>Requested Amount : {amount} USDT</Typography>
            <Typography style={{color:'#DBE9EE',fontFamily: 'Poppins, sans-serif'}}>Charge Amount : {(amount*5)/100} USDT</Typography>
            <Typography style={{color:'#DBE9EE',fontFamily: 'Poppins, sans-serif'}}>Total : {total} USDT</Typography>
            <Typography style={{color:'#DBE9EE',fontFamily: 'Poppins, sans-serif'}}>Account Balance : {info.balance} USDT</Typography>
            <div style={{display:'grid',justifyContent:'center',minWidth:'300px'}}>
              <TextField variant="standard" label='Enter Your USDT Address' 
              style={{color:"white",minWidth:'300px'}}
            value={address}
            helperText={warnad}
            onChange={(a)=>{
                setAddress(a.target.value)
                if(address.length < 10){
              setWarnad('invalid address')
                }else{
              setWarnad('')
                }
            }}
            />
            <TextField variant="standard" label='Enter the Amount you wish to Withdraw'
                helperText={warnab} 
            style={{color:"white",background:"#DADDD8",minWidth:'300px'}}  
            type="number"
            value={amount}
            onChange={(a)=>{
                setAmount(a.target.value)
                
            }}/></div>
            
            <Button variant="contained" style={{color:"white"}} onClick={()=>{
             if(info.balance < total){ 
               alert('Insufficient Balance')
            }else{

               Withdrawal();
            }
            }}>Withdraw</Button>
        </Stack>
    )
}
