import { Stack, Paper, Typography, Button, TextField, Divider, Box, Backdrop } from '@mui/material';
import { callAdminRpc } from '@/lib/adminRpcClient';
import { supabase } from '@/pages/api/supabase';
import { useEffect, useState, useRef } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import RedeemIcon from '@mui/icons-material/Redeem';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import { motion } from 'framer-motion'
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import PasswordIcon from '@mui/icons-material/Password';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import Modal from '@mui/material/Modal';
import Cover from './cover'
import { toast, Toaster } from "react-hot-toast";
import codesData from '@/pages/api/codes.json'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay';
const codes = Object.fromEntries((codesData.countries || []).map((country) => [country.code, country.name]))
export default function Users({ refs }) {
  const [searchR, setSearchR] = useState([])
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState({})
  const [search, setSearch] = useState([])
  const [activity, setActivity] = useState([]);
  const [pens, setPens] = useState(false);
  const [trans, setTrans] = useState(false);
  const [scroll, setScroll] = useState('paper');
  const [count, setCount] = useState(0)
  const descriptionElementRef = useRef(null);
  const [reading, setReading] = useState(0)
  const [readingD, setReadingD] = useState(0)
  //referral state
  const [openl, setOpenl] = useState(false);
  const handleOpenl = () => setOpenl(true);
  const handleClosel = () => setOpenl(false);
  const [rdis, setRdis] = useState({})
  //end referral state
  //bets state
  const [openb, setOpenb] = useState(false);
  const handleOpenb = () => setOpenb(true);
  const handleCloseb = () => setOpenb(false);
  //end of bets state

  //bets state
  const [openp, setOpenp] = useState(false);
  const handleOpenp = () => setOpenp(true);
  const handleClosep = () => setOpenp(false);
  //end of bets state

  //style start
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '60vh',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  //end of style
  useEffect(() => {
    if (trans) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
    //get count of users
    async function getCount() {
      const { data, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      console.log(count)
      setReading(count);
    }
    getCount();
    //get count of deposited users
    async function getDeposited() {
      const { data, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('firstd', true);
      console.log(count)
      setReadingD(count);
    }
    getDeposited();
  }, [trans]);

  const ChangeGcount = async (username) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 'gcount': 0 })
        .eq('username', username)

        console.log(error)
    } catch (e) {
      console.log(e)
    }
  }

  const Depositing = async (damount, dusername) => {
    try {

      const { data, error } = await callAdminRpc('depositor', { amount: damount, names: dusername })
      console.log(error);
      setPens(false);
    } catch (e) {

    }

  }
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
  //
  //power admin
  function PowerAdmin() {
    const [pass, setPass] = useState('');
    async function changePassword() {
      try {

        const response = await fetch('/api/admin/auth-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: display.description, password: pass }),
        })
        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.message || 'Password update failed')
        }
        toast.success("Password Changed")
        handleClosep();
        alert('success')
      } catch (e) {
        console.log(e)
        handleClosep()
      }
    }
    return (
      <Modal
        open={openp}
        onClose={handleClosep}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography style={{ color: '#2176AE', fontFamily: 'Poppins,sans-serif' }} variant='h3'>POWER ADMIN</Typography>
          <Typography style={{ color: '#FBB13C', fontFamily: 'Poppins,sans-serif' }}>{display.username}</Typography>
          <Typography style={{ color: 'black', fontFamily: 'Poppins,sans-serif' }}>{display.description}</Typography>
          <Stack direction='column' spacing={3}>
            <Typography style={{ color: 'black', fontFamily: 'Poppins,sans-serif' }}>Update User Password</Typography>
            <TextField placeholder='new password' sx={{ color: 'black' }} value={pass} onChange={(e) => {
              setPass(e.target.value)
            }} />
            <Button style={{ background: '#DAD2D8', color: '#143642' }} onClick={changePassword}>Update Password</Button>
          </Stack>
        </Box>
      </Modal>
    )
  }
  //end of power admin
  //start of 
  //reward-dialog
  function SimpleDialog({ }) {
    console.log('... reward dialog is loaded')
    const [amo, setAmo] = useState('');
    const [Re, setRe] = useState('');
    async function sendMsg() {
      const { error } = await supabase
        .from('activa')
        .insert({
          'code': Re,
          'username': display.title,
          'amount': amo
        });
      console.log(error);
      alert('Your request is already processed')
    }
    async function inform() {
      const { error } = await supabase
        .from('notification')
        .insert({ address: 'admin', username: display.title, amount: amo, sent: 'success', type: Re, method: 'usdt' })
      console.log(error);
    }
    async function deposit(damount, dusername) {
      const { data, error } = await callAdminRpc('depositor', { amount: damount, names: dusername })
      console.log(error);
      console.log('... deposited')
    }
    return (
      <Dialog onClose={() => {
        setPens(false)
      }} open={pens}>
        <DialogTitle>{display.title} Finances</DialogTitle>
        <Stack style={{ padding: '8px' }} spacing={4}>
          <Typography>You can edit the balances of any user in this page.<br /> Also remember to give a reason for the the change in user account balance</Typography>
          <TextField placeholder='amount to add'
            type='number'
            value={amo} onChange={(e) => {
              setAmo(e.target.value)
            }} />
          <TextField placeholder='reason for action e.g team bonus, sign up bonus'
            value={Re} onChange={(e) => {
              setRe(e.target.value)
            }}
          />
          <Button style={{ background: 'black', color: 'whitesmoke' }} onClick={() => {
            deposit(amo, display.title);
            sendMsg()
            inform()
            setAmo("")
            setRe("")
            setPens(false)
          }}>Send</Button>
        </Stack>
      </Dialog >
    )
  }
  //end
  //referrals dialog
  function ReferralModal() {
    const [lvl1n, setLvl1n] = useState('loading...')
    const [lvl2n, setLvl2n] = useState('loading...')
    const [lvl3n, setLvl3n] = useState('loading...')
    const [lvl2d, setLvl2d] = useState([])
    const [lvl1d, setLvl1d] = useState([])
    const [lvl3d, setLvl3d] = useState([])
    const [alvl1, setAlvl1] = useState(0);
    const [alvl2, setAlvl2] = useState(0);
    const [alvl3, setAlvl3] = useState(0);
    console.log('refers console is loaded ...')
    useEffect(() => {
      //uplines
      async function getUplineName1() {

        try {
          const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('newrefer', rdis.lvl1);
          setLvl1n(data[0].username);
        } catch (e) {
          setLvl1n('data is unavailable')
        }
      }
      getUplineName1();
      async function getUplineName2() {

        try {
          const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('newrefer', rdis.lvl2);
          setLvl2n(data[0].username);
        } catch (error) {
          setLvl2n('data is unavailable')
        }
      }
      getUplineName2();
      async function getUplineName3() {
        try {

          const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('newrefer', rdis.lvl3);
          setLvl3n(data[0].username);
        } catch (e) {
          setLvl3n('data is unavailable')
        }
      }
      getUplineName3();
      //downlines
      async function getDownlines1() {

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('refer', rdis.newrefer);
          setLvl1d(data);
          console.log(data)
        } catch (e) {
          //  setLvl1d([{username:'unavailable...',newrefer:'000000',email:'null@email.com'}])
        }
      }
      getDownlines1();
      async function getDownlines2() {

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('lvla', rdis.newrefer);
          setLvl2d(data);
        } catch (error) {
          // setLvl2d([{username:'unavailable...',newrefer:'000000',email:'null@email.com'}])
        }
      }
      getDownlines2();
      async function getDownlines3() {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('lvlb', rdis.newrefer);
          setLvl3d(data);
        } catch (e) {
          console.log(e)
        }
      }
      getDownlines3();
      //end downlines
      //active user
      async function getADownlines1() {

        try {
          const { data, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .match({
              'refer': rdis.newrefer,
              'firstd': true
            });
          setAlvl1(count);
          console.log(data)
        } catch (e) {
          //  setLvl1d([{username:'unavailable...',newrefer:'000000',email:'null@email.com'}])
        }
      }
      getADownlines1();
      async function getADownlines2() {

        try {
          const { data, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .match({
              'lvla': rdis.newrefer,
              'firstd': true
            });
          setAlvl2(count);
        } catch (error) {
          console.log('...error')
        }
      }
      getADownlines2();
      async function getADownlines3() {
        try {
          const { data, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .match({
              'lvlb': rdis.newrefer,
              'firstd': true
            });
          setAlvl3(count);
        } catch (e) {
          console.log(e)
        }
      }
      getADownlines3();
      //end active user
    }, []);

    return (
      <Modal
        open={openl}
        onClose={handleClosel}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack direction="column" alignItems="center" spacing={2}
          sx={{
            width: '730px', height: '400px', background: '#03045E'
            , position: 'absolute',
            top: '50%',
            left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #EE8F00', padding: '8px', overflowY: 'auto'
          }}>
          <Typography sx={{ fontSize: '36px', fontWeight: '900', color: '#EE8F00', fontFamily: 'Poppins,sans-serif' }}>
            REFERRAL
          </Typography>
          <Typography variant='caption' sx={{ color: 'white' }}>You are currently viewing {rdis.name} referral data</Typography>
          <div style={{ width: '100%', padding: '8px' }}>
            <Typography sx={{ fontSize: '16px', position: 'relative', left: '0', fontWeight: '600', color: '#2426F8', fontFamily: 'Poppins,sans-serif' }}>UPLINES</Typography>
            <Divider sx={{ background: '#7171A8' }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>1: {lvl1n}</Typography>
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>2: {lvl2n}</Typography>
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>3: {lvl3n}</Typography>
            </Stack>
            {/* active memebers noumbers */}
            <Typography sx={{ fontSize: '16px', position: 'relative', left: '0', fontWeight: '600', color: '#2426F8', fontFamily: 'Poppins,sans-serif' }}>Active Members</Typography>
            <Divider sx={{ background: '#7171A8' }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>Level 1 Active: {alvl1}</Typography>
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>Level 2 Active: {alvl3}</Typography>
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>Level 3 Active: {alvl3}</Typography>
              <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'light', fontFamily: 'Poppins,sans-serif' }}>All Level Active: {Number(alvl3) + Number(alvl2) + Number(alvl1)}</Typography>
            </Stack>
          </div>

          <div style={{ width: '100%', padding: '8px' }}>
            <Typography sx={{ fontSize: '16px', position: 'relative', left: '0', fontWeight: '600', color: '#2426F8', fontFamily: 'Poppins,sans-serif' }}>TEAM</Typography>
            <Divider sx={{ background: '#7171A8' }} />
            {
              //level1
            }
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: 'white', fontSize: '16px', padding: '8px', fontWeight: 'bold', fontFamily: 'Poppins,sans-serif' }}>LEVEL 1</Typography>
              <Typography sx={{ color: 'green', fontSize: '14px', padding: '8px', fontWeight: '500', fontFamily: 'Poppins,sans-serif' }}>{alvl1}</Typography>
            </Stack>
            {
              //listviews
            }
            <Stack direction="column" spacing={1}>
              {
                lvl1d.map((l) => {

                  return (
                    <Stack direction='row' key={l.username} justifyContent='space-between' sx={{ height: '35px', width: '100%', backgroundColor: '#1A1B72', padding: '8px', border: l.firstd ? '3px solid green' : 'none' }}>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.username}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.email}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.totald} USDT</Typography>
                    </Stack>
                  );
                })
              }
            </Stack>
            {
              //end of each levels
            }
            {
              //level2
            }
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: 'white', fontSize: '16px', padding: '8px', fontWeight: 'bold', fontFamily: 'Poppins,sans-serif' }}>LEVEL 2</Typography>
              <Typography sx={{ color: 'green', fontSize: '14px', padding: '8px', fontWeight: '500', fontFamily: 'Poppins,sans-serif' }}>{alvl2}</Typography>
            </Stack>
            {
              //listviews
            }
            <Stack direction="column" spacing={1}>
              {
                lvl2d.map((l) => {

                  return (
                    <Stack direction='row' key={l.username} justifyContent='space-between' sx={{ height: '35px', width: '100%', backgroundColor: '#1A1B72', padding: '8px', border: l.firstd ? '3px solid green' : 'none' }}>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.username}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.email}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'POpppins,sans-serif', fontSize: '15px' }}>{l.totald} USDT</Typography>
                    </Stack>
                  )
                })
              }
            </Stack>
            {
              //end of each levels
            }
            {
              //level3
            }
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: 'white', fontSize: '16px', padding: '8px', fontWeight: 'bold', fontFamily: 'Poppins,sans-serif' }}>LEVEL 3</Typography>
              <Typography sx={{ color: 'green', fontSize: '14px', padding: '8px', fontWeight: '500', fontFamily: 'Poppins,sans-serif' }}>{alvl3}</Typography>
            </Stack>
            {
              //listviews
            }
            <Stack direction="column" spacing={1}>
              {
                lvl3d.map((l) => {

                  return (
                    <Stack direction='row' key={l.username} justifyContent='space-between' sx={{ height: '35px', width: '100%', backgroundColor: '#1A1B72', padding: '8px', border: l.firstd ? '3px solid green' : 'none' }}>
                      <Typography sx={{ color: 'white', fontFamily: 'Popppins,sans-serif', fontSize: '15px' }}>{l.username}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'Popppins,sans-serif', fontSize: '15px' }}>{l.email}</Typography>
                      <Typography sx={{ color: 'white', fontFamily: 'Popppins,sans-serif', fontSize: '15px' }}>{l.totald} USDT</Typography>
                    </Stack>
                  )
                })
              }
            </Stack>
            {
              //end of each levels
            }
          </div>

        </Stack>
      </Modal>
    )
  }
  //end of referrals dialog
  //start of bets
  function ShowBet() {
    const [userbet, setUserBet] = useState([]);
    useEffect(() => {
      //get-user-bets
      async function getUserBets() {
        const { data, error } = await supabase
          .from('placed')
          .select('*')
          .eq('username', display.title)
          .order('id', { ascending: false });
        const rows = data || []
        const matchIds = [...new Set(rows.map((bet) => bet.match_id).filter(Boolean))]
        if (!matchIds.length) {
          setUserBet(rows)
          return
        }

        const { data: matches, error: matchError } = await supabase
          .from('bets')
          .select('match_id,tsgmt,date,time')
          .in('match_id', matchIds)

        if (matchError) {
          console.log(matchError)
          setUserBet(rows)
          return
        }

        const matchById = new Map((matches || []).map((match) => [match.match_id, match]))
        setUserBet(rows.map((bet) => {
          const match = matchById.get(bet.match_id)
          return match ? { ...bet, tsgmt: match.tsgmt, match_date: match.date, match_time: match.time } : bet
        }))
      }
      getUserBets();
    }, [])
    return (
      <Modal
        open={openb}
        onClose={handleCloseb}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack direction="column"
          sx={{
            width: '730px', height: '400px', background: '#03045E'
            , position: 'absolute',
            top: '50%',
            left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #0077B6', padding: '8px', overflowY: 'auto'
          }}
          spacing={1}>
          <Typography sx={{ fontSize: '36px', fontWeight: '900', color: '#00B4D8', fontFamily: 'Poppins,sans-serif' }}>
            Bets
          </Typography>
          <Typography variant='caption' sx={{ color: 'white' }}>You are currently viewing {display.title} betting data</Typography>

          {
            userbet.map((b) => {
              let day = new Date(b.created_at);
              const stams = getMatchStartMs(b);
              const curren = Date.now();
              const isFutureMatch = Boolean(stams && stams > curren);
              return (
                <Stack sx={{ border: "1px solid #90E0EF", padding: "8px", width: '100%' }} key={b.betid}>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#90E0EF', fontSize: '12px' }}>Match Name: {b.home} vs {b.away}</Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Stake : {b.stake} USDT</Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>ODD : {b.odd}</Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Market : {b.market}</Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Status : {isFutureMatch ? 'Not Started' : (b.won === 'null') ? 'Processing' : (b.won === 'true') ? 'Won' : 'Lost'} </Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Kickoff : <BetKickoff bet={b} /></Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Placed : {day.getDate() + '/' + day.getMonth() + '/' + day.getFullYear() + ' ' + day.getUTCHours() + ':' + day.getMinutes() + '  UTC'}</Typography>
                  <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#CAF0F8', fontSize: '12px' }}>Total : {parseInt(b.stake + b.aim)}</Typography>

                  <Button variant='standard' style={{ color: '#F05D5E', display: isFutureMatch ? 'visible' : 'none' }} onClick={() => {
                    const rem = async () => {

                      const { error } = await supabase
                        .from('placed')
                        .delete()
                        .eq('betid', b.betid);
                    }
                    rem();
                    Depositing(b.stake, b.username);
                    NUser('bet-cancellation', b.username, b.stake);
                    ChangeGcount(b.username)
                    alert('Bet Cancelled Successfully');
                    handleCloseb();
                  }}>Cancel this bet - Please Contact Admin to remove this bet</Button>
                </Stack>
              )
            })
          }

        </Stack>
      </Modal>
    )
  }
  //end of bets
  const getActivity = async () => {
    const { data, error } = await supabase
      .from('notification')
      .select('*')
      .eq('username', display.title)
    setActivity(data)
  }
  const getRefCount = async (refer) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`refer.eq.${refer},lvla.eq.${refer},lvlb.eq.${refer}`);
    setCount(data.length)
  }
  //onboarding
  return (
    <Cover>
      <Stack direction="column" sx={{ marginTop: '100px' }}>
        <PowerAdmin />
        <Toaster position="bottom-center" />
        <Stack direction='column' spacing={3} style={{ border: "1px solid #C61F41", padding: "15px", borderRadius: "12px", marginTop: "8px" }}>
          <Typography style={{ color: '#E6E8E6', fontFamily: "Source Sans Pro,sans-serif" }}> Users Analysis</Typography>
          <Stack direction='row' spacing={6}>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <ArrowCircleDownIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Total Users</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>{reading} Users</Typography>
              </Box>
            </Stack>
            <Stack direction='row' spacing={3} sx={{ background: "#C61F41", padding: "8px", borderRadius: "8px" }}>
              <ArrowCircleUpIcon sx={{ color: "#FDCA40" }} />
              <Box>
                <Typography variant="subtitle2" style={{ color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>Deposited users</Typography>
                <Typography style={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif" }}>{readingD} USERS</Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction='row' alignItems="left" spacing={5} >
          <ReferralModal />
          <ShowBet />
          <SimpleDialog
            open={pens}
            onClose={() => {
              setPens(false)
            }}
          />{
            //transaction dialog
          }
          <Dialog
            open={trans}
            onClose={() => {
              setTrans(false)
            }}
            scroll={scroll}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
            style={{ height: '600px' }}
          >
            <DialogTitle id="scroll-dialog-title">See Transactions</DialogTitle>
            <DialogContent dividers={scroll === 'paper'}>
              <DialogContentText
                id="scroll-dialog-description"
                ref={descriptionElementRef}
                tabIndex={-1}
              >
                <Stack direction='column' style={{ width: '40vh' }} spacing={1}>
                  {

                    activity.map((a) => {
                      let day = new Date(a.time);
                      return (
                        <Stack sx={{ border: "1px solid #F1A208", padding: "8px", width: '100%' }} key={a.uid}>
                          <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '12px' }}>Transaction Type: {a.type}</Typography>
                          <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#F1A208', fontSize: '12px' }}>Amount : {a.amount} USDT</Typography>
                          <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#F1A208', fontSize: '12px' }}>Method : {a.method} </Typography>

                          <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#F1A208', fontSize: '12px' }}>Status : {a.sent} </Typography>
                          <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#F1A208', fontSize: '12px' }}>Time : {day.getDate() + '/' + day.getMonth() + '/' + day.getFullYear() + ' ' + day.getUTCHours() + ':' + day.getMinutes() + '  UTC'}</Typography>
                        </Stack>
                      )
                    })
                  }
                </Stack>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setTrans(false)
              }}>Close</Button>
            </DialogActions>
          </Dialog>{
            //end of transaction dialog 
          }

          <Box>
            <Paper style={{
              padding: "8px", margin: "3px",
              background: "rgba(250, 250, 255, 0.34)",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(11.9px)",
              webkitBackdropFilter: "blur(11.9px)",
              border: "1px solid rgba(250, 250, 255, 0.93)",
              width: "335px"
            }}>
              <Stack direction="row" alignItems="left" sx={{ background: "none" }}>
                <TextField variant='standard' sx={{ width: "90%", background: 'white' }} label="search for users by Username" value={search}
                  onChange={(s) => {
                    let find = s.target.value
                    setSearch(find)
                    const newFilter = refs.filter((value) => {
                      return value.username.toLowerCase().includes(find.toLowerCase());
                    });
                    if (find === "") {
                      setSearchR([]);
                    } else {
                      setSearchR(newFilter);
                    }
                  }}
                />
                <ClearIcon onClick={() => {
                  setSearch("")
                  setSearchR([]);
                }} />
              </Stack>
              <Paper>
                {
                  searchR.map((d) => {
                    return (
                      <div style={{ padding: "5px" }} key={d.userId}><Typography style={{ cursor: "pointer" }}
                        onClick={() => {
                          setDisplay({
                            title: d.username
                            , description: d.userId
                            , phone: d.phone
                            , countrycode: d.countrycode
                            , count: d.count
                            , balance: d.balance
                            , email: d.email
                            , refer: d.newrefer
                            , address: "coming soon"
                            , password: d.password
                            , lvl1: d.refer
                            , lvl2: d.lvla
                            , lvl3: d.lvlb
                            , firstd: d.firstd
                            , cr: d.created_at || d.crdate
                            , totald: d.totald
                          })
                          setOpen(true)
                        }}
                      >{d.username}</Typography>
                        <Divider /></div>

                    )
                  })
                }

              </Paper>
            </Paper>
            <Stack direction="column" spacing={2} style={{ padding: "8px", marginTop: "70px" }}>
              <Paper>
                <Stack direction="row" sx={{ padding: "5px" }} spacing={3} >
                  <Typography sx={{ width: "80px", fontFamily: 'Marhey, cursive' }} >Username</Typography>
                  <Typography sx={{ width: "80px", fontFamily: 'Marhey, cursive' }}>Password</Typography>
                  <Typography sx={{ width: "80px", fontFamily: 'Marhey, cursive' }}>Invite Code</Typography>
                </Stack>
              </Paper>
              {
                //the main things
                refs.map((d) => {
                  return (
                    <Paper key={d.newrefer} sx={{ background: '#C61F41' }}>

                      <Stack direction="row" sx={{ padding: "5px" }} spacing={3}>
                        <Typography sx={{ width: "80px", cursor: "pointer", color: '#AC915FD2', fontFamily: "Source Sans Pro,sans-serif" }}>{d.username}</Typography>
                        <Typography sx={{ width: "80px", fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2' }}>{d.password}</Typography>
                        <Typography sx={{ width: "80px", fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2' }}>{d.newrefer}</Typography>
                        <ArrowRightIcon sx={{ color: 'white' }}
                          onClick={() => {
                            setDisplay({
                              title: d.username
                              , description: d.userId
                              , phone: d.phone
                              , country: "null"
                              , balance: d.balance
                              , refer: d.newrefer
                              , address: "coming soon"
                              , password: d.password
                              , countrycode: d.countrycode
                              , email: d.email
                              , lvl1: d.refer
                              , lvl2: d.lvla
                              , lvl3: d.lvlb
                              , firstd: d.firstd
                              , cr: d.created_at || d.crdate
                              , totald: d.totald
                            })
                            getRefCount(d.newrefer);
                          }} />

                      </Stack>
                    </Paper>
                  )
                })
                //end of main things
              }
            </Stack>
          </Box>
          <Box>
            <Divider orientation='vertical' sx={{ background: '#AC915FD2' }} /></Box>
          <Box style={{ position: 'fixed', top: 0, width: '300px', right: 0, margin: '80px', marginTop: '70px', padding: '8px', background: 'whitesmoke', borderRadius: '13px' }}>
            <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', width: '100%', fontSize: '14px' }}>{display.description}</Typography>
            <Stack direction="row" spacing={2}>
              <Stack direction="column" spacing={0}>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Username: {display.title}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Email: {display.email}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Phone: {display.phone}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Balance: {Number(display.balance).toFixed(2)} USDT</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>User Status: {(display.firstd) ? 'Active' : 'InActive'}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Total Deposit: {display.totald} USDT</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Date Opened: {new Date(display.cr).getDate() + '-' + parseInt(new Date(display.cr).getMonth() + 1) + '-' + new Date(display.cr).getFullYear()}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Country: {codes[display.countrycode]} ({display.countrycode})</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Invite Code : {display.refer}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>Invited {count}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#AC915FD2', fontSize: '15px' }}>USDT Address {display.address}</Typography>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#F1A208' }}> {display.password}</Typography>
              </Stack>
            </Stack>
            <motion.div whileHover={{ scale: '1.02' }} onClick={() => {

              setPens(true)
            }}>
              <Stack direction='row' sx={{ backgroundColor: "#79ADDC", borderRadius: '8px', padding: '8px', margin: "3px" }} justifyContent='space-between'>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }}>Reward</Typography>
                <RedeemIcon sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }} />
              </Stack>
            </motion.div>
            <motion.div whileHover={{ scale: '1.02' }} onClick={() => {
              handleOpenl()
              setRdis({
                newrefer: display.refer,
                name: display.title,
                lvl1: display.lvl1
                , lvl2: display.lvl2
                , lvl3: display.lvl3
              })
            }}>
              <Stack direction='row' sx={{ backgroundColor: "#1B263B", borderRadius: '8px', padding: '8px', margin: "3px" }} justifyContent='space-between'>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }}>Refferal</Typography>
                <Diversity1Icon sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }} />
              </Stack>
            </motion.div>
            <motion.div whileHover={{ scale: '1.02' }} onClick={handleOpenb}>
              <Stack direction='row' sx={{ backgroundColor: "#F7B1AB", borderRadius: '8px', padding: '8px', margin: "3px" }} justifyContent='space-between'>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }}>Bets</Typography>
                <SportsSoccerIcon sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }} />
              </Stack>
            </motion.div>
            <motion.div whileHover={{ scale: '1.02' }} onClick={() => {
              getActivity();
              setTrans(true)
            }}>
              <Stack direction='row' sx={{ backgroundColor: "#F1A208", borderRadius: '8px', padding: '8px', margin: "3px" }} justifyContent='space-between'

              >
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }}>Transactions</Typography>
                <ReceiptIcon sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }} />
              </Stack>
            </motion.div>
            <motion.div whileHover={{ scale: '1.02' }} onClick={handleOpenp}>
              <Stack direction='row' sx={{ backgroundColor: "#bc6c25", borderRadius: '8px', padding: '8px', margin: "3px" }} justifyContent='space-between'>
                <Typography sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }}>Power Admin</Typography>
                <SportsSoccerIcon sx={{ fontFamily: "Source Sans Pro,sans-serif", color: '#FFFCF7' }} />
              </Stack>
            </motion.div>
            <Divider sx={{ background: "#F1A208" }} />
          </Box>
        </Stack>
      </Stack>
    </Cover>
  )
}

function BetKickoff({ bet }) {
  const display = useClientMatchDisplay(bet)
  return <>{display.dateTime}</>
}

export async function getServerSideProps(context) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('users')
    .select()
    .order('id', { ascending: false });

  const refs = data;
  return {
    props: { refs }, // will be passed to the page component as props
  }
}
