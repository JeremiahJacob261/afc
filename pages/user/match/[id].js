import { Typography, Stack, Divider, Button, Paper } from "@mui/material"
import { supabase } from "@/pages/api/supabase"
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import Head from 'next/head';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Cover from '../cover'
import { Drawer } from '@mui/material'
import toast, { Toaster } from "react-hot-toast";
import { app } from '@/pages/api/firebase';
import Image from 'next/image'
import Loading from "../../components/loading";
import { motion } from 'framer-motion'
import Ims from '@/public/simps/ball.png'
// import Depx from '@/public/depx.png'
import Bal from '@/public/bball.png'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { formatMatchDate, formatMatchTime } from '@/lib/matchDisplay';
import { waitForPaint } from '@/lib/uiFeedback';




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

function getMatchOdd(match, market, level) {
    const baseOdd = Number(match?.[market] || 0)
    const vipBonus = Number(vip[level] || 0)
    const value = baseOdd + vipBonus
    return Number.isFinite(value) ? value : 0
}

function formatOdd(value) {
    return Number.isFinite(value) && value > 0 ? value.toFixed(3) : 'N/A'
}

function getLeagueName(match) {
    return (match?.league === 'others' ? match?.otherl : match?.league) || 'League unavailable'
}

function getTeamName(name, fallback) {
    return name || fallback
}

function getMatchStartSeconds(match) {
    const timestamp = Number(match?.tsgmt || 0)
    return Number.isFinite(timestamp) ? timestamp / 1000 : 0
}

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
    const router = useRouter()
    const initialMatch = Array.isArray(matchDat) && matchDat.length ? matchDat[0] : null
    const hasRun = useRef(false);
    //snackbar1
    const [messages, setMessages] = useState("")
    const [opened, setOpened] = useState(false)
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });
    //end of snackbar1

    const [matches, setMatches] = useState(initialMatch || {})
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
       
        setMatches(initialMatch || {})

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
                toast.error('Unable to load your account')
            }
        }

        GET();

        return () => {
            active = false;
        }
    }, [initialMatch, router]);

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
    const displayDate = formatMatchDate(matches)
    const displayTime = formatMatchTime(matches)
    const leagueName = getLeagueName(matches)
    const homeName = getTeamName(matches.home, 'Home')
    const awayName = getTeamName(matches.away, 'Away')

    if (!initialMatch) {
        return (
            <Cover>
                <Stack style={{ width: "100%", minHeight: '100vh', background: '#06101F', padding: '24px' }} alignItems="center" justifyContent="center" spacing={2}>
                    <Head>
                        <title>Match unavailable</title>
                        <link rel="icon" href="/european.ico" />
                    </Head>
                    <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontWeight: '600' }}>Match unavailable</Typography>
                    <Typography sx={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '13px', textAlign: 'center' }}>
                        This match could not be found or is no longer available.
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/user/matches')} sx={{ background: '#1BB6FF', color: '#06101F' }}>
                        Back to matches
                    </Button>
                </Stack>
            </Cover>
        )
    }

    //main ui
    return (
        <Cover>
            <Toaster position="bottom-center"
                reverseOrder={false} />
            <Loading open={openx} handleClose={handleClosex} />
            <Stack style={{ width: "100%", minHeight: '100vh', background: '#06101F' }} alignItems="center">
                <Draws />
                <Sncks message={messages} />
                <Head>
                    <title>{homeName} VS {awayName}</title>
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
                        display:'flex',flexDirection:'column', justifyContent:'center', alignItems:'space-between',
                        marginBottom: "8px", padding: "18.5px",
                        background: '#10284D',
                        width: '343px',
                        borderRadius: '5px',
                    }} >
                    <Stack direction='column'>
                        <Typography style={{ color: '#E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{leagueName}</Typography>
                        <Divider sx={{ background: '#E9E5DA' }} />
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{homeName}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{displayTime}</Typography>
                            <p style={{color:'#E9E5DA'}}>|</p>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{displayDate}</Typography>
                        </Stack>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{awayName}</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ background: '#E9E5DA' }} />

                    {
                        marketsArray.map((m) => {
                            return (
                                <Stack direction="column" spacing={1} key={m.num}>
                                    <Stack  style={{ minWidth: '300px', height: '40px'
                                        ,display:'flex',flexDirection:'row', justifyContent:'space-between', alignItems:'center', }}>
                                        <p style={{ color: '#E9E5DA', padding: '8px' }}>{m.num}</p>
                                        <p style={{ color: '#1BB6FF', padding: '8px' }}>{formatOdd(getMatchOdd(matches, m.word, viplevel))}%</p>
                                        <motion.div
                                            onClick={() => {
                                                if (getMatchOdd(matches, m.word, viplevel) <= 0) {
                                                    toast.error('This market is not available')
                                                    return
                                                }
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
        const tofal = Number(getMatchOdd(matches, picked, viplevel).toFixed(3));
        const stakeAmount = Number(stake || 0);
        const profit = Number(((stakeAmount * tofal) / 100).toFixed(3));
        const expext = Number((stakeAmount + profit).toFixed(3));
        let gcount = info.gcount ?? 0;
        let ball = Number(balance || 0);

        let stamx = getMatchStartSeconds(matches);
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
                            <Typography style={{ color: '#E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{leagueName}</Typography>
                            <Divider sx={{ background: '#E9E5DA' }} />
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{homeName}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{displayTime}</Typography>
                                <p style={{color:'#E9E5DA'}}>|</p>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{displayDate}</Typography>
                            </Stack>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{awayName}</Typography>
                            </Stack>

                        </Stack>
                        <Divider sx={{ background: '#E9E5DA' }} />
                        <Stack direction='column' spacing={3}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Match ID</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{matches.match_id || 'Unavailable'}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Market</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{markets[picked] || 'No market selected'}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>Odds</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{formatOdd(tofal)}</Typography>
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
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{ball.toFixed(3)} USDT</Typography>
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
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{profit.toFixed(3)} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>Expected Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>{expext.toFixed(3)} USDT</Typography>
                        </Stack>
                        <Button disabled={openx} sx={{ fontFamily: 'Poppins,sans-serif', margin: '8px', fontSize: '16', fontWeight: '300', color: '#06101F', background: "#1BB6FF", padding: '10px' }}
                            onClick={() => {
                                if (openx) return
                                if (!picked || tofal <= 0) {
                                    toast.error('Please choose an available market')
                                } else if (stakeAmount - 1 < Number(info.balance || 0)) {
                                    if (stakeAmount < 1) {
                                        toast.error('You do not have sufficient balance for this transaction')
                                   
                                    } 
                                    //for development purposes
                                    else if (stamx < currenv) {
                                        toast.error('This Match has expired')

                                    } else if (gcount > 2) {
                                        toast.error('You have reached the maximum number of bets for today');

                                    } else {
                                        handleClose();
                                        handleOpenx()
                                        const deductBet = async () => {
                                            try {
                                                await waitForPaint()
                                                const response = await authFetch('/api/place-bet', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        match_id: matches.match_id,
                                                        picked,
                                                        stake: stakeAmount,
                                                    }),
                                                })
                                                const result = await response.json().catch(() => ({}))
                                                if (!response.ok || result.status !== 'success') {
                                                    toast.error(result.message || 'Unable to place bet')
                                                    handleClosex()
                                                    return
                                                }

                                                setMessages(result.message || "Bet Successful")
                                                handleClick();
                                                router.push('/user/bets');
                                            } catch (error) {
                                                console.log(error)
                                                toast.error('Unable to place bet. Please try again.')
                                                handleClosex()
                                            }
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
    try {
        const id = context.params?.id;
        if (!id) {
            return { props: { matchDat: [] } }
        }

        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id)
            .maybeSingle();

        if (error) {
            console.error('Unable to load match:', error);
            return { props: { matchDat: [] } }
        }

        return { props: { matchDat: data ? [data] : [] } }
    } catch (error) {
        console.error('Match page error:', error);
        return { props: { matchDat: [] } }
    }
}
