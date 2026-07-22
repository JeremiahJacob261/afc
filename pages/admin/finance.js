import { Button, Typography, Paper, Stack, Box, Divider } from "@mui/material"
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import { callAdminRpc } from '@/lib/adminRpcClient';
import React, { useEffect, useState, useContext } from "react"
import { supabase } from '@/pages/api/supabase'
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
import { sd, pass } from '@/pages/api/pass'
import { AppContext } from '@/pages/api/Context'
import Image from 'next/image'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Backdrop as Dec } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import CachedSharpIcon from '@mui/icons-material/CachedSharp';
import Popover from '@mui/material/Popover';
import logoUsdt from '@/public/tether.png'
import CryptoJS from "crypto-js";
import logoMtn from '@/public/mtn.png'
import logoAirtel from '@/public/airtel.png'
import logoGpay from '@/public/gpay.png'
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import Cover from './cover'
import Zoom from '@mui/material/Zoom';
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
export default function Noti({ notiS }) {
  const roomOne = supabase.channel('notification')
  console.log('loaded ...');
  const rates = {
    'usdt': 1,
    'idr': 16255
  };
  const [noti, setNoti] = useState(notiS);
  const [name, setName] = useState('')
  const [deposit, setDeposit] = useState(0)
  //security-action
  const { log, setLog } = useContext(AppContext)
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false)
  const [text, setText] = useState("")
  const [messages, setMessages] = useState("")
  const [drop, setDrop] = useState(false);
  const [droplink, setDroplink] = useState('');
  const [eligibles, setEligibles] = useState({});
  const [bonus, setBonus] = useState(0);
  const [reading, setReading] = useState({});

  //noti
  const NUser = async (reason, username, amount) => {
    const { error } = await supabase
      .from('activa')
      .insert({
        'code': reason,
        'username': username,
        'amount': amount
      });
  }
  //noity end
  //popover

  //end-popover
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {

    const bytes = CryptoJS.AES.decrypt(sd, pass);
    const datas = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    if (text === datas) {
      setOpened(false);
      setMessages("Welcome Admin!")
      handleClick()
      setOpen(false)
    } else {
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
  //useEffect
  useEffect(() => {
    // async function getNoti(){
    //   try{
    //     const { data, error } = await supabase
    //     .from('notification')
    //     .select()
    //     .limit(200)
    //     .order('id', { ascending: false });
    //  setNoti(data);
    //   }catch(e){
    //     console.log(e)
    //   }
    // }
    // getNoti();
    if (log === false) {
      setOpen(false)
    }
    async function read() {
      const { data, error } = await supabase
        .from('reading')
        .select()
      setReading(data[0])
      console.log(data);
    }
    read();
    async function listener() {
      //payload
      const handleInserts = (payload) => {
        console.log('Change received!', payload)
      }
      try {
        const changes = supabase
          .channel('supabase_realtime')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen only to INSERTs
              schema: 'public',
            },
            (payload) => {
              console.log([...noti, payload.new]);
              console.log(payload);
              // setNoti([...noti,payload.new])
            }
          )
          .subscribe();
      } catch (e) {
        console.log(e)
      }

      //end payload
    }
    listener();
  }, [setOpen, log, noti]);


  function Sncks({ message }) {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
        <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    )
  }
  //end-of security-action
  const removeitem = async (itemize) => {
    const newList = noti.filter((item) => item.uid !== itemize);
    const { data, error } = await supabase
      .from('notification')
      .select()
    setNoti(data);
  }
  const updateS = async (uid) => {
    const { error } = await supabase
      .from('notification')
      .update({ sent: 'success' })
      .eq('uid', uid)
  }
  const updateC = async (uid) => {
    const { error } = await supabase
      .from('notification')
      .update({ sent: 'failed' })
      .eq('uid', uid)
  }
  const Depositing = async (damount, dusername) => {
    const { data, error } = await callAdminRpc('depositor', { amount: damount, names: dusername })
    console.log(error);
  }
  const SEL = async (damount, dusername) => {
    const { data, error } = await callAdminRpc('self', { amount: (damount < 12000) ? 0 : damount * 0.1, name: dusername })
    console.log(error);
  }
  const uploadTotal = async (dname, damount) => {
    const { data, error } = await callAdminRpc('gatherd', { names: dname, amount: parseFloat(damount) })
    console.log(error)
  }

  const RefBonus = async (damount, dusername, refer, lvla, lvlb) => {
    //if amount is greater than 1000 - not more than 60
    if (damount > 1000) {
      const { data, error } = await callAdminRpc('reffix', { amount: damount, name: dusername, refers: refer, lvls: lvla, lvlss: lvlb })
      console.log(error);
    } else {
      const { data, error } = await callAdminRpc('refbonus', { amount: damount, name: dusername, refers: refer, lvls: lvla, lvlss: lvlb })
      console.log(error);
    }
  }
  const Reads = async (dtype, damount) => {
    const { data, error } = await callAdminRpc(dtype, { amount: damount })
    console.log(error);
  }

  //bonuses adding
  const selfBonus = async (damount, dusername) => {
    //check if user is eligible for bonus
    let el = {};
    const eligible = async (dusername, damount) => {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('username', dusername);
      let el = data[0];
      console.log(el.firstd);
      if (!el.firstd) {
        SEL(damount, dusername);
        RefBonus(damount, dusername, el.refer, el.lvla, el.lvlb);
      } else {

      }
    }
    eligible(dusername, damount)
    //end of check
    console.log(el)
  }
  //end of bonuses adding
  return (
    <Cover>
      <div style={{ minHeight: '100vh', marginTop: '100px' }} >
        <Dec
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={drop}
          onClick={() => {
            setDrop(false)
          }}
        >
          <Stack direction="column" spacing={6} alignItems='center'>
            <CancelIcon onClick={() => {
              setDrop(false);
              setDroplink('');
            }} />
            <Image
              alt="Loading Receipt..."
              src={droplink}
              width={300}
              height={500}
            />
          </Stack>
        </Dec>
        <Sncks message={messages} />
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
              onChange={(t) => {
                setText(t.target.value)
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Login</Button>
          </DialogActions>
        </Dialog>
        {
          //login screen ends
        }
        <Stack direction='column' spacing={3} style={{ border: "1px solid #C61F41", padding: "15px", borderRadius: "12px", marginTop: "8px" }}>
          <Typography style={{ color: '#E6E8E6', fontFamily: "Source Sans Pro,sans-serif" }}> Summary</Typography>
          <Stack direction='row' spacing={6}>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <ArrowCircleDownIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Deposits</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>$ {reading.deposit}</Typography>
              </Box>
            </Stack>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <ArrowCircleUpIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Disbursements</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>$ {reading.withdraw}</Typography>
              </Box>
            </Stack>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <SoupKitchenIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Spent On Bets</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}> $ {reading.bet}</Typography>
              </Box>
            </Stack>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <TimesOneMobiledataIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Gotten from Bets</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}> $ {reading.won}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction='row' justifyContent='space-between' alignItems="center">
          <Typography style={{ color: '#E6E8E6', fontFamily: "Source Sans Pro,sans-serif", margin: "8px" }}>RECENT TRANSACTION</Typography>
          <motion.div whileTap={{ backgroundColor: '#C61F41', borderRadius: "5px", transform: "rotate(270deg)" }}
            whileHover={{ backgroundColor: '#C61F41', borderRadius: "5px", transform: "rotate(90deg)" }}
          >
            <CachedSharpIcon color="primary" onClick={async () => {
              const { data, error } = await supabase
                .from('notification')
                .select()
                .limit(200)
                .order('id', { ascending: false });
              setNoti(data);
            }} />
          </motion.div>
        </Stack>
        <Stack style={{ border: "1px solid #C61F41", padding: "15px", borderRadius: "12px", marginTop: "8px", marginBottom: '12px' }}>
          <Stack direction="row" spacing={8}>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Transaction Date</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Type</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>username</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>amount</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Status</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>address/image</Typography>
            <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>Decision</Typography>

          </Stack>
          <Divider sx={{ background: '#AC915FD2' }} />
          <Stack direction="column">
            {noti.map((d) => {
              var dts = new Date(d.time);
              if (d.sent === "pending") {
                //pending
                return (
                  <Stack key={d.uid} sx={{ margin: "3px" }} spacing={8} direction='row'>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{dts.getDate() + '/' + parseInt(dts.getMonth() + 1) + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</Typography>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                      <Tooltip
                        TransitionComponent={Fade}
                        TransitionProps={{ timeout: 600 }}
                        title="Add"
                      >
                        <Image alt="method"
                          onClick={() => { console.log(d) }}
                          src={(d.method === 'usdt') ? logoUsdt : (d.method === 'gpay') ? logoGpay : (d.method === 'airtel') ? logoAirtel : logoMtn} width={20} height={15} sx={{ padding: '3px' }}
                        />
                      </Tooltip>
                      <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}> {d.type}</Typography>
                    </Stack>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.username}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.amount}</Typography>
                    <div style={{ background: '#EFEFD0', padding: "5px", borderRadius: '6px' }}>
                      <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif" }}>PENDING</Typography>
                    </div>
                    <motion.div whileHover={{ backgroundColor: '#C61F41', borderRadius: "8px" }}>
                      <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer", textAlign: 'center', justifyContent: 'center' }}
                        onClick={() => {
                          if (d.type === 'withdraw') {
                            navigator.clipboard.writeText(d.address)
                            setMessages("FCFA Address Copied Successfully!")
                            handleClick()
                          } else {
                            setDrop(true);
                            setDroplink(d.address);
                          }
                        }}>{(d.type === 'deposit') ? 'See Receipt' : 'COPY'}</Typography>
                    </motion.div> <Stack direction='row' style={{ width: "80px" }}>
                      <CheckIcon style={{ color: "green" }}
                        onClick={async () => {

                          NUser(d.method + d.type + 'success', d.username, d.amount);
                          if (d.type === 'withdraw') {
                            updateS(d.uid);
                            const { data, error } = await supabase
                              .from('notification')
                              .select()
                            setNoti(data);
                            Reads('readwithdraw', d.amount)
                          } else {

                            //use rates always 
                            Depositing(d.amount / rates[d.method], d.username);
                            selfBonus(d.amount / rates[d.method], d.username);
                            uploadTotal(d.username, d.amount / rates[d.method])
                            Reads('readdeposit', d.amount / rates[d.method])
                            updateS(d.uid);

                          }
                        }}
                      />
                      <CancelIcon onClick={() => {
                        NUser(d.method + d.type + 'failed', d.username, d.amount);
                        if (d.type === 'withdraw') {
                          ///the reason san1 was in existence was because the cancellation would return an unconverted value to the user 
                          let san1 = d.amount / rates[d.method]; //d.amount / rates[d.method];
                          Depositing(san1, d.username);
                          updateC(d.uid);
                          removeitem(d.uid);
                        } else {

                          updateC(d.uid);
                          removeitem(d.uid);
                        }
                      }}
                        style={{ color: "red" }} />
                    </Stack>
                  </Stack>

                )
              } else {
                //completed
                return (
                  <Stack key={d.uid} sx={{ margin: "3px" }} spacing={8} direction='row'>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{dts.getDate() + '/' + parseInt(dts.getMonth() + 1) + '/' + dts.getFullYear() + ' ' + dts.getHours() + ':' + dts.getMinutes()}</Typography>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                      <Tooltip
                        title={d.method}
                      >
                        <Image alt="method"
                          onClick={() => { console.log(d) }}
                          src={(d.method === 'usdt') ? logoUsdt : (d.method === 'gpay') ? logoGpay : (d.method === 'airtel') ? logoAirtel : logoMtn} width={20} height={15} sx={{ padding: '3px' }}
                        />
                      </Tooltip>
                      <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}> {d.type}</Typography>
                    </Stack>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.username}</Typography>
                    <Typography style={{ fontSize: '12px', color: 'white', fontFamily: "Source Sans Pro,sans-serif", width: "80px" }}>{d.amount}</Typography>
                    <div style={{ background: '#A1EF8B', padding: "5px", borderRadius: '6px', minWidth: '70px' }}>
                      <Typography style={{ fontSize: '12px', color: (d.sent === 'success') ? '#539987' : 'red', fontFamily: "Source Sans Pro,sans-serif" }}>{(d.sent === 'success') ? 'COMPLETED' : 'Failed'}</Typography>
                    </div>
                    <motion.div whileHover={{ backgroundColor: '#C61F41', borderRadius: "8px" }}>
                      <Typography style={{ fontSize: '12px', color: '#F1A208', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer", textAlign: 'center', justifyContent: 'center' }}
                        onClick={() => {
                          if (d.type === 'withdraw') {
                            navigator.clipboard.writeText(d.address)
                            setMessages("FCFA Address Copied Successfully!")
                            handleClick()
                          } else {
                            setDrop(true);
                            setDroplink(d.address);
                          }
                        }}>{(d.type === 'deposit') ? 'See Receipt' : 'COPY'}</Typography>
                    </motion.div>
                    <Typography sx={{ fontSize: '12px', color: '#E3E7AF', fontFamily: "Source Sans Pro,sans-serif", width: "80px", cursor: "pointer" }}>Done</Typography>
                  </Stack>
                )

              }
            })

            }
          </Stack >
        </Stack>
      </div>
    </Cover>
  )
}
export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  const { data, error } = await supabase
    .from('notification')
    .select()
    .limit(200)
    .order('id', { ascending: false });
  const notiS = data;
  return {
    props: {
      ...i18nProps, notiS }, // will be passed to the page component as props
  }
}
