import { Typography, Stack, Divider, Button, Paper } from "@mui/material"
import { supabase } from "../../api/supabase"
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import Head from 'next/head';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Cover from '../cover'
import { Drawer } from '@mui/material'
import toast, { Toaster } from "react-hot-toast";
import { app } from '../../api/firebase';
import Image from 'next/image'
import Loading from "../../components/loading";
import { motion } from 'framer-motion'
import Ims from '@/public/simps/ball.png'
// import Depx from '@/public/depx.png'
import Bal from '@/public/bball.png'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';




async function processBets(name) {
    try {
        await fetch('/api/rpc/process_bets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        console.log('Bets processed for', name)
    } catch (err) {
        console.error('Error processing bets:', err)
    }
}

export default function Match({ matchDat }) {
    //backdrop
    const hasRun = useRef(false);
    //end of backdrop
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
    const [picked, setPicked] = useState('')
    const [odds, setOdds] = useState(0);
    const [bottom, setBottom] = useState(false)
    const [info, setInfo] = useState({});
    const [balance, setBalance] = useState(0);
    const [refCount, setRefCount] = useState(0);
    const [viplevel, setViplevel] = useState(1);
    const auth = getAuth(app);
    const Reads = async (dtype, damount) => {
        try {
            await fetch(`/api/rpc/${dtype}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: damount })
            })
        } catch (e) {
            console.log(e)
        }
    }



    useEffect(() => {
        let active = true;
       
        matchDat.map((m) => {
            setMatches(m)
        })

        const GET = async () => {
            const session = await requireSession(router);
            if (!session) return;
            clearLegacyAuthStorage();

            try {
                const response = await authFetch('/api/me');
                if (response.status === 401 || response.status === 404) {
                    await supabase.auth.signOut();
                    router.push('/login');
                    return;
                }

                const result = await response.json();
                if (!active || result.status !== 'success') return;

                setInfo(result.profile);
                setBalance(Number(result.profile.balance || 0));
                setRefCount(result.referralCount || 0);
                setViplevel(result.vip?.viplevel || 1);
                hasRun.current = true;
            } catch (e) {
                console.log(e)
            }
        }

        GET();

        return () => {
            active = false;
        }
    }, [matchDat, router]);
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

    const marketsArray = [
        { word: "nilnil", num: "0 - 0" },
        { word: "onenil", num: "1 - 0" },
        { word: "nilone", num: "0 - 1" },
        { word: "oneone", num: "1 - 1" },
        { word: "twonil", num: "2 - 0" },
        { word: "niltwo", num: "0 - 2" },
        { word: "twoone", num: "2 - 1" },
        { word: "onetwo", num: "1 - 2" },
        { word: "twotwo", num: "2 - 2" },
        { word: "threenil", num: "3 - 0" },
        { word: "nilthree", num: "0 - 3" },
        { word: "threeone", num: "3 - 1" },
        { word: "onethree", num: "1 - 3" },
        { word: "twothree", num: "2 - 3" },
        { word: "threetwo", num: "3 - 2" },
        { word: "threethree", num: "3 - 3" },
        { word: "otherscores", num: "Other" }
    ];
    const vip = {
        '1': 0,
        '2': 0.015,
        '3': 0.030,
        '4': 0.050,
        '5': 0.070,
        '6': 0.095,
        '7': 0.125
    }

    //the below controls the loading modal
    const [openx, setOpenx] = useState(false);
    const handleOpenx = () => setOpenx(true);
    const handleClosex = () => setOpenx(false);

    //the end of thellaoding modal control
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
    console.log(new Date(matches.date))
    console.log(matches)
    let date = parseInt(new Date(matches.date).getMonth() + 1);
    let day = new Date(matches.date).getDate();
    let tix = matches.time ?? '00:00:00';
    let [th, tm, ts] = tix.split(':');
    let time = parseFloat(th - 1) + ":" + tm;

    //main ui
    return (
        <Cover>
            <Toaster position="bottom-center"
                reverseOrder={false} />
            <Loading open={openx} handleClose={handleClosex} />
            <Stack style={{ width: "100%", minHeight: '100vh', background: '#06101F' }} alignItems="center">
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
                    <meta name="description" content="A Premium EFC  match" />
                    <link rel="icon" href="/european.ico" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <Stack direction='row' alignItems='left' justifyContent='left' spacing={1} sx={{ width: '100%', margin: '5px' }} onClick={() => { router.push('/user/matches') }}>
                    <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#E9E5DA' }} />
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontWeight: '300', width: '90%', textAlign: 'center' }}>Stake your bet</Typography>
                </Stack>


                <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'

                    style={{
                        marginBottom: "8px", padding: "18.5px",
                        background: '#10284D',
                        width: '343px',
                        borderRadius: '5px',
                    }} >
                    <Stack direction='column'>
                        <Typography style={{ color: '#E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{(matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                        <Divider sx={{ background: '#E9E5DA' }} />
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                            <p style={{color:'#E9E5DA'}}>|</p>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                        </Stack>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ background: '#E9E5DA' }} />

                    {
                        marketsArray.map((m) => {
                            return (
                                <Stack direction="column" spacing={1} key={m.num}>
                                    <Stack direction="row" alignItems="center" justifyContent={"space-around"} sx={{ minWidth: '300px', height: '40px' }}>
                                        <p style={{ color: '#E9E5DA', padding: '8px' }}>{m.num}</p>
                                        <p style={{ color: '#1BB6FF', padding: '8px' }}>{parseFloat(matches[m.word] + vip[viplevel]).toFixed(3)}%</p>
                                        <motion.div
                                            onClick={() => {
                                                setPicked(m.word)
                                                setBottom(true)
                                            }}
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                            style={{ cursor: 'pointer', color: '#06101F', background: (matches.comarket != m.word) ? '#1BB6FF' : '#1BB6FF', padding: '4px', borderRadius: '5px' }}>choose</motion.div>
                                    </Stack>
                                    <Divider sx={{ bgcolor: "secondary.light" }} />
                                </Stack>
                            )
                        })
                    }


                </Stack>
            </Stack>
        </Cover>
    );
    function Draws() {
        const [stake, setStake] = useState('');
        let tofal = Number((parseFloat(matches[picked]) + vip[viplevel]).toFixed(3));
        let profit = parseFloat((stake * tofal) / 100);
        let expext = Number((parseFloat(stake) + profit).toFixed(3));
        console.log(profit)
        let gcount = info.gcount ?? 0;
        let ball = parseFloat(balance.toFixed(3));

        let stamx = matches.tsgmt / 1000;
        let d1 = new Date();
        d1.toUTCString();
        // two hours less than my local time
        let d1utc = Math.floor(d1.getTime() / 1000);
        // let curren = new Date().getTime() / 1000;
        let currenv = d1utc;
        return (
            <Drawer
                anchor='bottom'
                open={bottom}
                onClose={() => {
                    setBottom(false)
                }}
            >

                <Cover>
                    <Stack direction='column' spacing={2} style={{ background: '#06101F', padding: '8px', minHeight: '90vh', paddingBottom: '70px' }}>
                        <Stack direction='row' sx={{ padding: '5px' }}>
                            <KeyboardArrowLeftOutlinedIcon style={{ color: '#E9E5DA' }} onClick={() => {
                                setBottom(false)
                            }} />
                            <Typography sx={{ width: '100%', fontFamily: 'Poppins,sans-serif', textAlign: 'center', color: '#E9E5DA' }}>Stake your bet</Typography>
                        </Stack>
                        <Stack direction='column' alignItems='center' justifyContent='center'>
                            <Typography style={{ color: '#E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{(matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                            <Divider sx={{ background: '#E9E5DA' }} />
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                                <p style={{color:'#E9E5DA'}}>|</p>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                            </Stack>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                            </Stack>

                        </Stack>
                        <Divider sx={{ background: '#E9E5DA' }} />
                        <Stack direction='column' spacing={3}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Match ID</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{matches.match_id}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Market</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{markets[picked]}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Odds</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{tofal}</Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={{ background: '#E9E5DA' }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA', width: '210px' }}>Enter the amount you wish to stake</Typography>
                            {/* <Image src={Depx} alt="deposit" width={87} height={32} onClick={()=>{
                                router.push('/user/deposit')
                            }}/> */}
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA' }}>Account Balance</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{ball} USDT</Typography>
                        </Stack>
                        <input placeholder='stake' type='text'
                            style={{ fontFamily: 'Poppins, sans-serif', padding: "10px", borderRadius: '12px', width: '100%', background: '#06101F', color: '#FFFFFF', border: '3px solid #E9E5DA' }}
                            value={stake}
                            onChange={(e) => {
                                if (!isNaN(e.target.value)) {
                                    setStake(e.target.value)
                                }

                            }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA' }}>Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{parseFloat(profit).toFixed(3)} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>Expected Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>{expext} USDT</Typography>
                        </Stack>
                        <Button sx={{ fontFamily: 'Poppins,sans-serif', margin: '8px', fontSize: '16', fontWeight: '300', color: '#06101F', background: "#1BB6FF", padding: '10px' }}
                            onClick={() => {
                                if (stake - 1 < info.balance) {
                                    if (stake < 1) {
                                        toast.error('You do not have sufficient balance for this transaction')
                                    } else if (stamx < currenv) {
                                        toast.error('This Match has expired')

                                    } else if (gcount > 2) {
                                        toast.error('You have reached the maximum number of bets for today');

                                    } else {
                                        handleClose();
                                        handleOpenx()
                                        let balls = parseFloat(ball) - parseFloat(stake ?? 0);
                                        const deductBet = async () => {
                                            const response = await authFetch('/api/place-bet', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    match_id: matches.match_id,
                                                    picked,
                                                    stake: Number(stake),
                                                }),
                                            })
                                            const result = await response.json()
                                            if (!response.ok || result.status !== 'success') {
                                                toast.error(result.message || 'Unable to place bet')
                                                handleClosex()
                                                return
                                            }

                                            setMessages(result.message || "Bet Successful")
                                            handleClick();
                                            router.push('/user/bets');
                                        }
                                        deductBet();
                                    }
                                } else {
                                    toast.error("You do not have Enough USDT to Complete this BET");
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

export async function getServerSideProps(context) {
    const { params } = context;
    const id = params.id;
    const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('match_id', id);
    let matchDat = data;
    return { props: { matchDat } }
}
