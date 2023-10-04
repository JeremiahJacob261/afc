import { Typography, Stack, Divider, Button, Paper, TextField } from "@mui/material"
import { supabase } from "../../api/supabase"
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useRouter } from "next/router";
import React, { useEffect, useState, useContext } from "react";
import Head from 'next/head';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Cover from '../cover'
import { Drawer } from '@mui/material'
import { app } from '../../api/firebase';
import Image from 'next/image'
import Ims from '../../../public/simps/ball.png'
import Depx from '../../../public/depx.png'
import Bal from '../../../public/bball.png'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
export default function Match({ matchDat }) {
    //backdrop
    const [drop, setDrop] = useState(false)
    //snackbar1
    const [messages, setMessages] = useState("")
    const [opened, setOpened] = useState(false)
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });
    //end of snackbar1
    const [matches, setMatches] = useState({})
    const [display, setDisplay] = useState({})
    const [open, setOpen] = useState(false)
    const [picked,setPicked] = useState('')
    const [odds,setOdds] = useState(0);
    const [bottom, setBottom] = useState(false)
    const [info, setInfo] = useState({});
    const [refCount, setRefCount] = useState(0);
    const [viplevel, setViplevel] = useState(1);
    const auth = getAuth(app);
    const Reads = async (dtype, damount) => {
        const { data, error } = await supabase
            .rpc(dtype, { amount: damount })
        console.log(error);
    }
    useEffect(() => {

        matchDat.map((m) => {
            setMatches(m)
        })
        const useri = localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // ...
      
        const GET = async () => {
          try{
const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', name)
          setInfo(data[0]);
          localStorage.setItem('signRef', data[0].newrefer);
          async function getReferCount() {
            try {
              const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('refer', localStorage.getItem('signRef'))
              setRefCount(count)
              setViplevel((info.totald < 50 && count < 3) ? '1' : (info.totald < 100 && count < 5) ? '2' : (info.totald < 200 && count < 8) ? '3' : (info.totald < 300 && count < 12) ? '4' : (info.totald < 500 && count < 15) ? '5' : (info.totald < 1000 && count < 20) ? '6' : '7' );
              console.log(count)
              console.log(error)
              console.log(info.totald)
            } catch (e) {
              console.log(e)
            }
          }
          getReferCount();
          }catch(e){
            console.log(e)
            alert('Please Check your Internet Connection and Refresh the Website')
          }
          
        }
        GET();
      
    } else {
      // User is signed out
      const sOut = async () => {
        const { error } = await supabase.auth.signOut();
                console.log('sign out');
                console.log(error);
                localStorage.removeItem('signedIn');
                localStorage.removeItem('signUid');
                localStorage.removeItem('signName');
                localStorage.removeItem('signRef');
                router.push('/login');
                }
                sOut();
    }
    }, []);
    const router = useRouter()
    const markets = {
        "nilnil": "0 - 0",
        "onenil": "1 - 0",
        "nilone": "0 - 1",
        "oneone": "1 - 1",
        "twonil": "2 - 0",
        "niltwo": "0 - 2",
        "twoone": "2 - 1",
        "onetwo": "1 - 2",
        "twotwo": "2 - 2",
        "threenil": "3 - 0",
        "nilthree": "0 - 3",
        "threeone": "3 - 1",
        "onethree": "1 - 3",
        "twothree": "2 - 3",
        "threetwo": "3 - 2",
        "threethree": "3 - 3",
        "otherscores": "Other"
    }
    const vip = {
        '1':0,
        '2':0.015,
        '3':0.030,
        '4':0.050,
        '5':0.070,
        '6':0.095,
        '7':0.125
    }
    //dialog-start
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    //dialog-end
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
    //end of snackbar2
    function Sncks({ message }) {
        return (
            <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
                <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        )
    }
    let stams = Date.parse(matches.date + " " + matches.time) / 1000;
    let curren = new Date().getTime() / 1000;
    console.log(new Date(matches.date))
    console.log(matches)
    let date = parseInt(new Date(matches.date).getMonth() + 1);
    let day = new Date(matches.date).getDate();
    let time = matches.time;

    //main ui
    return (
        <Cover>
        <Stack style={{ width: "100%", minHeight: '100vh', background: '#E5E7EB' }} alignItems="center">
            <Draws />
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={drop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Sncks message={messages} />
            <Head>
                <title>{matches.home} VS {matches.away}</title>
                <meta name="description" content="A Premium AFCFIFA match" />
                <link rel="icon" href="/logo_afc.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '5px', margin: '2px' }} onClick={()=>{ router.push('/user/matches') }}>
                <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} />
                <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', width: '90%', textAlign: 'center' }}>Stake your bet</Typography>
            </Stack>


            <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'

                style={{
                    marginBottom: "8px", padding: "18.5px",
                    background: '#F5F5F5',
                    width: '343px',
                    borderRadius: '5px',
                }} >
                <Stack direction='column'>
                    <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{(matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                    <Divider sx={{ background: 'black' }} />
                </Stack>
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                    <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                        <Image src={matches.ihome ? matches.ihome : Ims} width={65} height={50} alt='home' sx={{ borderRadius:'10px'}}/>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                        <p>|</p>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                    </Stack>
                    <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                        <Image src={matches.iaway ? matches.iaway : Ims} width={65} height={50} alt='away' sx={{ borderRadius:'10px'}}/>
                        <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                    </Stack>
                </Stack>
                <Divider sx={{ background: 'black' }} />
                <Stack direction='column' spacing={3}>
                    <Stack direction='row' alignItems='center' spacing={2}>
                        <Image src={Bal} width={24} height={24} alt='balls' />
                        <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Home Picks</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction='row' spacing={2} justifyContent='space-around'>
                        <Stack direction='row' justifyContent='space-around' alignItems='center'
                         sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }} 
                        onClick={()=>{
                            setPicked('onenil')
                            setBottom(true)
                        }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-0</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.onenil) + vip[viplevel]}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }} onClick={()=>{
                            setPicked('twonil')
                            setBottom(true)
                        }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-0</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.twoone)+ vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}
                        onClick={()=>{
                            setPicked('threenil')
                            setBottom(true)
                        }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-0</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.threenil) + vip[viplevel]}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}
                        onClick={()=>{
                            setPicked('twoone')
                            setBottom(true)
                        }}
                        >
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-1</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.twoone) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}
                        onClick={()=>{
                            setPicked('threeone')
                            setBottom(true)
                        }}
                        >
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-1</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{parseFloat(Number(matches.threeone) + vip[viplevel]).toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}
                        onClick={()=>{
                            setPicked('threetwo')
                            setBottom(true)
                        }}
                        >
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-2</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.threetwo) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>

                    <Stack direction='row' alignItems='center' spacing={2}>
                        <Image src={Bal} width={24} height={24} alt='balls' />
                        <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Away Picks</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction='row' spacing={2} justifyContent='space-around'>
                        <Stack onClick={()=>{
                            setPicked('nilone')
                            setBottom(true)
                        }}
                        direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-1</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.nilone) + vip[viplevel]}</Typography>
                        </Stack>
                        <Stack direction='row' onClick={()=>{
                            setPicked('niltwo')
                            setBottom(true)
                        }} justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-2</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.niltwo) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack direction='row' onClick={()=>{
                            setPicked('nilthree')
                            setBottom(true)
                        }} justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-3</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{parseFloat(Number(matches.nilthree) + vip[viplevel]).toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction='row' onClick={()=>{
                            setPicked('onetwo')
                            setBottom(true)
                        }} justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-2</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.onetwo) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack onClick={()=>{
                            setPicked('onethree')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-3</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.onethree) + vip[viplevel]}</Typography>
                        </Stack>
                        <Stack onClick={()=>{
                            setPicked('twothree')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-3</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{parseFloat(Number(matches.twothree) + vip[viplevel]).toFixed(2)}</Typography>
                        </Stack>
                    </Stack>

                    <Stack direction='row' alignItems='center' spacing={2}>
                        <Image src={Bal} width={24} height={24} alt='balls' />
                        <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Draw Picks</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction='row' spacing={2} justifyContent='space-around'>
                        <Stack onClick={()=>{
                            setPicked('nilnil')
                            setBottom(true)
                        }}direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-0</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{vip[viplevel] + (matches.nilnil * 1)}</Typography>
                        </Stack>
                        <Stack onClick={()=>{
                            setPicked('oneone')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-1</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.oneone) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack onClick={()=>{
                            setPicked('twotwo')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-2</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.twotwo) + vip[viplevel]}</Typography>
                        </Stack>
                        <Stack  onClick={()=>{
                            setPicked('threethree')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-3</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{parseFloat(Number(matches.threethree) + vip[viplevel]).toFixed(2)}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' spacing={2} >
                        <Stack onClick={()=>{
                            setPicked('otherscores')
                            setBottom(true)
                        }} direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>Others</Typography>
                            <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>{Number(matches.otherscores) + vip[viplevel]}</Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
      </Cover>
    );
    function Draws() {
        const [stake,setStake] = useState(0);
        let tofal = Number(matches[picked]) + vip[viplevel];
        let profit = Number((stake * tofal)/100);
        let expext = Number(stake) + profit;
        console.log(profit)
        let ball = info.balance;
        return (
            <Drawer
                anchor='bottom'
                open={bottom}
                onClose={() => {
                    setBottom(false)
                }}
            >
                
                <Cover>
                <Stack direction='column' spacing={2} style={{ background: '#E5E7EB', padding: '8px', minHeight: '100vh',paddingBottom:'12px' }}>
                    <Stack direction='row' sx={{ padding: '5px' }}>
                        <KeyboardArrowLeftOutlinedIcon onClick={()=>{
                            setBottom(false)
                        }}/>
                        <Typography sx={{ width: '100%', fontFamily: 'Poppins,sans-serif', textAlign: 'center' }}>Stake your bet</Typography>
                    </Stack>
                    <Stack direction='column' alignItems='center' justifyContent='center'>
                    <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{ (matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                    <Divider sx={{ background: 'black' }} />
                  </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={Ims} width={50} height={50} alt='home' />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                            <p>|</p>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                        </Stack>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={Ims} width={50} height={50} alt='away' />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                        </Stack>

                    </Stack>
                    <Divider sx={{ background: 'black' }} />
                    <Stack direction='column' spacing={3}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: 'black' }}>Match ID</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: 'black' }}>{matches.match_id}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: 'black' }}>Market</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: 'black' }}>{markets[picked]}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: 'black' }}>Odds</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: 'black' }}>{tofal}</Typography>
                        </Stack>
                    </Stack>
                <Divider sx={{ background: 'black' }}/>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: 'black',width:'210px' }}>Enter the amount you wish to stake</Typography>
                            <Image src={Depx} alt="deposit" width={87} height={32} onClick={()=>{
                                router.push('/user/deposit')
                            }}/>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: 'black' }}>Account Balance</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: 'black' }}>{info.balance} USDT</Typography>
                        </Stack>
                        <TextField variant="outlined" label='stake' type='number' sx={{ fontFamily: 'Poppins, sans-serif', padding: "10px", width: '100%', background: '#E5E7EB',color:'#03045E' }}
                        value={stake}
                        onChange={(e)=>{
                            setStake(e.target.value)
                        }}
                        />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: 'black' }}>Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: 'black' }}>{profit} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: 'black' }}>Expected Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: 'black' }}>{expext} USDT</Typography>
                        </Stack>
                        <Button sx={{fontFamily: 'Poppins,sans-serif',margin:'8px', fontSize: '16', fontWeight: '300', color: '#E5E7EB',background:"#03045E",padding:'10px'}} 
                        onClick={()=>{
                            if (stake - 1 < info.balance) {
                                if (stake < 1) {
                                    alert('You do not have sufficient balance for this transaction')
                                } else {
                                    handleClose()
                                    let balls = ball - stake;
                                    const deductBet = async () => {
                                        const { error } = await supabase
                                            .from('users')
                                            .update({ balance: balls })
                                            .eq('username', info.username)
                                        console.log(error)
                                        setMessages("Bet Successful")
                                        handleClick();
                                    }
                                    const saveToDB = async () => {
                                        const { error } = await supabase
                                            .from('placed')
                                            .upsert({
                                                'match_id': matches.match_id,
                                                'market': markets[picked],
                                                'username': info.username,
                                                'started': false,
                                                'stake': Number(stake),
                                                'profit': Number(((matches[picked] * stake) / 100)).toFixed(2),
                                                'aim': profit,
                                                "home": matches.home,
                                                "away": matches.away,
                                                "time": matches.time,
                                                "date": matches.date,
                                                "odd": matches[picked],
                                                "ihome":matches.ihome,
                                                "iaway":matches.iaway
                                            })
                                        console.log(error)
                                    }
                                    const saveToUser = async () => {
                                        const { error } = await supabase
                                            .from('useractivity')
                                            .upsert({
                                                'type': 'bets',
                                                'amount': stake + (matches[picked] * stake) / 100,
                                                'user': info.username,
                                                'match_id': display.matchId,
                                                'stake': Number(stake),
                                                'profit': Number(((matches[picked] * stake) / 100)),
                                                'market': markets[picked]
                                            })
                                        console.log(error)
                                    }
                                    saveToUser();
                                    deductBet();
                                    saveToDB();
                                    Reads('readbet', stake);

                                    router.push('/user/matches');
                                }
                            } else {
                                alert("You do not have Enough USDT to Complete this BET");
                            }
                        }}
                        >
                            Place Bet
                        </Button>
                </Stack>
                </Cover>
            </Drawer>
        )
    }
}

export async function getStaticPaths() {
    const { data, error } = await supabase
        .from('bets')
        .select()
    const paths = data.map((ref) => ({
        params: { id: ref.match_id },
    }))



    return { paths, fallback: true }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
    // params contains the post `id`.
    // If the route is like /posts/1, then params.id is 1
    const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('match_id', params.id)
    let matchDat = data;

    // Pass post data to the page via props
    return { props: { matchDat } }
}
