import { Stack, TextField, Typography ,Button,Box} from "@mui/material";
import {supabase} from './api/supabase'
import { useContext } from "react";
import { AppContext } from "./api/Context";
import React,{ useState } from "react";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
export default function Withdrawal() {
    const {info,setInfo} = useContext(AppContext)
    const [amount,setAmount] = useState(0)
    const [address,setAddress] = useState("")
    const [amthelp,setAmthelp] = useState("")
       //snackbar1
       const [messages,setMessages] = useState("")
       const [opened,setOpened] = useState(false)
       const [dea,setDea] = useState("visible")
       const [deb,setDeb] = useState("hidden")
       const Alert = React.forwardRef(function Alert(props, ref) {
           return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
         });
         //end of snackbar1
    const Verify =()=>{
        const options = {method: 'GET', headers: {accept: 'application/json'}};

fetch('https://api.shasta.trongrid.io/v1/accounts/TA8nMZztXvjX2DSVEfzgA1xs32WHA7Shtz/transactions?only_confirmed=true&only_unconfirmed=false&only_to=true&only_from=false', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
    }
    const checkDepo=async()=>{
        const {error} = await supabase
        .from('notification')
        .insert({ address: address,username:info.username, amount: amount,sent:false,type:"deposit" })
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
        <div>
            <Sncks message={messages}/>
            <Stack direction="column" spacing={3}>
              <Stack 
              direction="column" spacing={3}
              sx={{
                  visibility:dea
                }}>
              <TextField variant="standard" 
                label="Enter Amount You Wish To Deposit"
                value={amount}
                onChange={(a)=>{
                    setAmount(a.target.value)
                }}
                helperText={amthelp}
               sx={{
                background:"whitesmoke"
               }}
                />
                <Button 
                variant="contained"
                onClick={()=>{
                  if(amount < 10){
                    setAmthelp("The Minimum Deposit is 10 USDT")
                  }else{
                    setDea('hidden')
                  setDeb('visible')
                  }
                  
                }}>Next</Button>
                </Stack>
                <Stack  direction="column" spacing={3} sx={{
                  visibility:deb
                }}>
                <Typography >Send Your USDT to this Address  :  </Typography>
                <Typography style={{color:"black",background:"whitesmoke",padding:"4px",cursor:"pointer"}} onClick={()=>{
                    navigator.clipboard.writeText("TA8nMZztXvjX2DSVEfzgA1xs32WHA7Shtz")
                    setMessages("Address Copied")
                    handleClick();
                }}>TA8nMZztXvjX2DSVEfzgA1xs32WHA7Shtz</Typography>
               
                <Typography variant="caption" sx={{color:"whitesmoke"}}>Click the Address to Copy</Typography>
                <Typography variant="caption" sx={{color:"red"}}>The Minimum Deposit is 10 USDT ,
                Deposits less than 10 USDT will be ignored.
                </Typography>
                
                <TextField variant="standard" label="Your USDT Address" 
                 value={address}
                 onChange={(a)=>{
                     setAddress(a.target.value)
                 }}
                />
                <Button variant='contained' style={{color:"white"}} onClick={()=>{
                    checkDepo()
                      setDea('visible')
                  setDeb('hidden')
                
                }}>Verify Transaction</Button>
                <Typography variant="caption" style={{color:"white"}} >Click this Button within 20Mins after depositing to Verify.
                     Failure To Verify the Transaction will result in Lost Funds</Typography>
                     </Stack>
            </Stack>
        </div>
    )
}