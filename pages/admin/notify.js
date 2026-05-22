import { Button, Typography, Paper, Stack, Box, Divider } from "@mui/material"
import React,{ useEffect, useState,useContext } from "react"
import { supabase } from './api/supabase'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import CheckIcon from '@mui/icons-material/Check';
import { motion } from "framer-motion";
import styles from '@/styles/Home.module.css'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {AppContext} from './api/Context'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
export default function Noti({ notiS }) {
  const [noti, setNoti] = useState(notiS);
  const [name, setName] = useState('')
  const [deposit, setDeposit] = useState(0)
   //security-action
   const {log,setLog} = useContext(AppContext) 
   const [open,setOpen] = useState(false);
   const [opened,setOpened] = useState(false)
   const [text,setText] = useState("")
   const [messages,setMessages] = useState("")
   const handleClickOpen = () => {
       setOpen(true);
     };
  
     const handleClose = () => {
       if(text === "invisibleadmin"){
          setOpened(false);
          setMessages("Welcome Admin!")
          handleClick()
          setOpen(false)
          setLog(true)
       }else{
         setMessages("Wrong PassWord!")
         handleClick()
         setText("")
       }
      
     };
     const handleClick = () => {
       setOpened(true);
     };
   
     const handleClosed = (event, reason) => {
       if (reason === 'clickaway') {
         return;
       }
   
       setOpened(false);
     };
     useEffect(()=>{
     if(log === false){
       setOpen(true)
     }
     },[setOpen,log])
     function Sncks({message}){
       return(
         <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
         <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
          {message}
         </Alert>
       </Snackbar>
       )
     }
 //end-of security-action
  const removeitem = (itemize) => {
    const newList = noti.filter((item) => item.uid !== itemize);
    setNoti(newList);
  }
  const update = async (uid) => {
    const { error } = await supabase
      .from('notification')
      .update({ sent: true })
      .eq('uid', uid)
  }

  const Depositing = () => {
    console.log(name)
    const cuBalance = async () => {
      const { data, error } = await supabase
        .rpc('depositor', { amount: deposit, names: name })
    }
    const getBalance = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('deposit')
        .eq('username', name)
      //the logic is ,if a users value of deposit-count is less than 1, the amount deposited with be 
      //multiplied by ten percent ,1.1.
      console.log(data)
      if (data[0].deposit < 1) {
        const depoIn = async () => {
          const { data, error } = await supabase
            .rpc('deposits', { name: name })
        }
        const bonus = async () => {
          const { data, error } = await supabase
            .rpc('bonus', { names: name, amount: deposit })
        }
        const cua = async () => {
          const { data, error } = await supabase
            .from('useractivity')
            .insert({
              type: 'deposit', amount: deposit,
              user: name,
              count: 0
            })
          console.log(error)
        }
        cua()
        bonus()
        depoIn()
      } else {
        const depoIn = async () => {
          const { data, error } = await supabase
            .rpc('deposits', { name: name })
          console.log(error)
        }
        const cua = async () => {
          const { data, error } = await supabase
            .from('useractivity')
            .insert({
              type: 'deposit', amount: deposit,
              user: name,
              count: 0
            })
        }
        cua()
        depoIn()
      }
    }
    getBalance()
    cuBalance()

  }
  return (
    <div>
      <Sncks message={messages}/>
    <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Login To Admin DashBoard</DialogTitle>
        <DialogContent>
          <DialogContentText>
           Typing In Your Passsword will Give You Access To Information About All Users.And Control Over The Site &lsquo;afcfifa.com&lsquo;
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Password"
            type="text"
            fullWidth
            variant="standard"
            value={text}
            onChange={(t)=>{
              setText(t.target.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Login</Button>
        </DialogActions>
      </Dialog>
      <Stack direction='column' spacing={3} style={{ border: "1px solid #C61F41", padding: "15px", borderRadius: "12px", marginTop: "8px" }}>
        <Typography style={{ color: '#E6E8E6', fontFamily: "Source Sans Pro,sans-serif" }}> Summary</Typography>
        <Stack direction='row' spacing={6}>
          <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
            <ArrowCircleDownIcon sx={{ color: "#FDCA40" }} />
            <Box>
              <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Deposits</Typography>
              <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>$ 1,234</Typography>
            </Box>
          </Stack>
          <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
            <ArrowCircleUpIcon sx={{ color: "#FDCA40" }} />
            <Box>
              <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Disbursements</Typography>
              <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>$ 200</Typography>
            </Box>
          </Stack>
          <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
            <SoupKitchenIcon sx={{ color: "#FDCA40" }} />
            <Box>
              <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Spent On Bets</Typography>
              <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}> $ 600</Typography>
            </Box>
          </Stack>
          <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
            <TimesOneMobiledataIcon sx={{ color: "#FDCA40" }} />
            <Box>
              <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Gotten from Bets</Typography>
              <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}> $ 5000</Typography>
            </Box>
          </Stack>
        </Stack>
      </Stack>
      <Typography style={{ color: '#E6E8E6', fontFamily: "Source Sans Pro,sans-serif", margin: "8px" }}>RECENT TRANSACTION</Typography>
      <Stack style={{ border: "1px solid #C61F41", padding: "15px", borderRadius: "12px", marginTop: "8px" }}>
        <Stack direction="row" spacing={8}>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Transaction Date</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Type</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>username</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>amount</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Status</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>address</Typography>
          <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Decision</Typography>

        </Stack>
        <Divider sx={{ background: '#AC915FD2' }} />
        <Stack direction="column-reverse">
          {noti.map((d) => {
            if (d.type === "withdrawer" && d.sent === false) {
              return (
                <Stack key={d.address} sx={{ margin: "3px" }} spacing={8} direction='row'>
                  <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.created_at}</Typography>
                  <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}> {d.type}</Typography>
                  <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.username}</Typography>
                  <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.amount}</Typography>
                  <div style={{ background: '#EFEFD0', padding: "5px", borderRadius: '6px' }}>
                    <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif" }}>PENDING</Typography>
                  </div>
                  <motion.div whileHover={{backgroundColor:'#C61F41',borderRadius:"8px"}}>
                    <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer",textAlign:'center',justifyContent:'center' }} onClick={() => {
                      navigator.clipboard.writeText(d.address)
                    }}>COPY</Typography>
                     </motion.div> <Stack direction='row' style={{ width: "80px" }}>
                    <CheckIcon style={{ color: "green" }}
                      onClick={() => {
                        const wih = async (damount, dusername) => {
                          const { data, error } = await supabase
                            .rpc('withdrawer', { amount: damount, names: dusername })
                        }
                        const cus = async (deposit, name) => {
                          const { data, error } = await supabase
                            .from('useractivity')
                            .insert({
                              type: 'withdraw', amount: deposit,
                              user: name,
                              count: 0
                            })
                          console.log(error)
                        }
                        cus(d.amount, d.username)
                        wih(d.amount, d.username);
                        update(d.uid);
                        removeitem(d.uid)
                      }}
                    />
                    <CancelIcon onClick={() => {
                      update(d.uid);
                      removeitem(d.uid)
                    }}
                      style={{ color: "red" }} />
                  </Stack>
                </Stack>

              )
            } else {
              if (d.type === "deposit" && d.sent === false) {
                return (
                  <Stack key={d.address} sx={{ margin: "3px" }} spacing={8} direction='row'>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.created_at}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}> {d.type}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.username}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.amount}</Typography>
                    <div style={{ background: '#EFEFD0', padding: "5px", borderRadius: '6px', width: '73px', alignItems: 'center' }}>
                      <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif" }}>PENDING</Typography>
                    </div>
                    <motion.div whileHover={{backgroundColor:'#C61F41',borderRadius:"8px"}}>
                    <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer",textAlign:'center',justifyContent:'center' }} onClick={() => {
                      navigator.clipboard.writeText(d.address)
                    }}>COPY</Typography>
                     </motion.div>
                    <Stack direction='row' style={{ width: "80px" }}>
                      <motion.div whileHover={{backgroundColor:'#C61F41',borderRadius:"8px",padding:'3px'}}>
                         <CheckIcon style={{ color: "green" }}
                        onClick={() => {
                          setDeposit(d.amount)
                          setName(d.username)
                          Depositing()
                          update(d.uid);
                          removeitem(d.uid)
                        }}
                      />
                      </motion.div>
                     <motion.div whileHover={{backgroundColor:'#C61F41',borderRadius:"8px",padding:'3px'}}>
                      
                      <CancelIcon onClick={() => {
                        update(d.uid);
                        removeitem(d.uid)
                      }}
                        style={{ color: "red" }} />
                     </motion.div>
                    </Stack>
                  </Stack>
                )
              } else {
                return (
                  <Stack key={d.address} sx={{ margin: "3px" }} spacing={8} direction='row'>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.created_at}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}> {d.type}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.username}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.amount}</Typography>
                    <div style={{ background: '#A1EF8B', padding: "5px", borderRadius: '6px' }}>
                      <Typography style={{ fontSize: '12px', color: '#539987', fontFamily: "Source Sans Pro,sans-serif" }}>COMPLETED</Typography>
                    </div>
                    <motion.div whileHover={{backgroundColor:'#C61F41',borderRadius:"8px"}}>
                    <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer",textAlign:'center',justifyContent:'center' }} onClick={() => {
                      navigator.clipboard.writeText(d.address)
                    }}>COPY</Typography>
                     </motion.div>
                    <Typography sx={{ fontSize: '12px',color:'#E3E7AF', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer" }}>Done</Typography>
                  </Stack>
                )
              }
            }
          })}
          </Stack >
        </Stack>
    </div>
  )
}
export async function getServerSideProps(context) {
  const { data, error } = await supabase
    .from('notification')
    .select()
  const notiS = data;
  return {
    props: { notiS }, // will be passed to the page component as props
  }
}