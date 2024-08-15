import { Typography, Stack, Divider, Button, Paper } from "@mui/material"
import { supabase } from "../../api/supabase"
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useRouter } from "next/router";
import React, { useEffect, useState, useContext } from "react";
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
import Ims from '../../../public/simps/ball.png'
// import Depx from '../../../public/depx.png'
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
    const [picked, setPicked] = useState('')
    const [odds, setOdds] = useState(0);
    const [bottom, setBottom] = useState(false)
    const [info, setInfo] = useState({});
    const [balance, setBalance] = useState(0);
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
        const useri = localStorage.getItem('signedIns');
        if (useri) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user

            const uid = localStorage.getItem('signUids');
            const name = localStorage.getItem('signNames');
            // ...

            const GET = async () => {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select()
                        .eq('username', name)
                    setInfo(data[0]);
                    setBalance(data[0].balance)
                    let infox = data[0];
                    localStorage.setItem('signRef', data[0].newrefer);
                    async function getReferCount() {
                        try {
                            const { count, error } = await supabase
                                .from('users')
                                .select('*', { count: 'exact', head: true })
                                .match({
                                    'refer': localStorage.getItem('signRef'),
                                    'firstd': true
                                });
                            setRefCount(count)
                            setViplevel((infox.totald < 50 || count < 3) ? '1' : (infox.totald < 100 || count < 5) ? '2' : (infox.totald < 200 || count < 8) ? '3' : (infox.totald < 300 || count < 12) ? '4' : (infox.totald < 500 || count < 15) ? '5' : (infox.totald < 1000 || count < 20) ? '6' : '7');
                            console.log(count)
                            console.log(error)
                            console.log(infox.totald)
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    getReferCount();
                } catch (e) {
                    console.log(e)
                }

            }
            GET();

        } else {
            // User is signed out
            const sOut = async () => {
                const { error } = await supabase.auth.signOut();
                console.log('sign out');
                console.log(error);
                localStorage.removeItem('signedIns');
                localStorage.removeItem('signUids');
                localStorage.removeItem('signNames');
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
            <Toaster position="bottom-center"
                reverseOrder={false} />
            <Loading open={openx} handleClose={handleClosex} />
            <Stack style={{ width: "100%", minHeight: '100vh', background: '#242627' }} alignItems="center">
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
                    <meta name="description" content="A Premium BFC  match" />
                    <link rel="icon" href="/brentford.ico" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <Stack direction='row' alignItems='left' justifyContent='left' spacing={1} sx={{ width: '100%', margin: '5px' }} onClick={() => { router.push('/user/matches') }}>
                    <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#CACACA' }} />
                    <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontWeight: '300', width: '90%', textAlign: 'center' }}>Stake your bet</Typography>
                </Stack>


                <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'

                    style={{
                        marginBottom: "8px", padding: "18.5px",
                        background: '#373636',
                        width: '343px',
                        borderRadius: '5px',
                    }} >
                    <Stack direction='column'>
                        <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{(matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                        <Divider sx={{ background: '#CACACA' }} />
                    </Stack>
                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                            <p>|</p>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                        </Stack>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' sx={{ borderRadius: '10px' }} />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ background: '#CACACA' }} />

                    {
                        marketsArray.map((m) => {
                            return (
                                <Stack direction="column" spacing={1} key={m.num}>
                                        <Stack direction="row" alignItems="center" justifyContent={"space-around"} sx={{ minWidth: '300px', height: '40px' }}>
                                    <p style={{ color:'#cacaca',padding:'8px' }}>{m.num}</p>
                                    <p style={{ color:'#FFB400',padding:'8px' }}>{matches[m.word]}%</p>
                                    <motion.div 
                                    onClick={()=>{ 
                                        setPicked(m.word)
                                        setBottom(true)
                                    }}
                                    whileHover={{ scale:1.1 }} whileTap={{ scale :0.95}}
                                    style={{ color:'#cacaca',background:'#E94E55',padding:'4px',borderRadius:'5px'}}>choose</motion.div>
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
        let ball = parseFloat(balance.toFixed(3));
        return (
            <Drawer
                anchor='bottom'
                open={bottom}
                onClose={() => {
                    setBottom(false)
                }}
            >

                <Cover>
                    <Stack direction='column' spacing={2} style={{ background: '#242627', padding: '8px', minHeight: '90vh', paddingBottom: '70px' }}>
                        <Stack direction='row' sx={{ padding: '5px' }}>
                            <KeyboardArrowLeftOutlinedIcon style={{ color: '#CACACA' }} onClick={() => {
                                setBottom(false)
                            }} />
                            <Typography sx={{ width: '100%', fontFamily: 'Poppins,sans-serif', textAlign: 'center', color: '#CACACA' }}>Stake your bet</Typography>
                        </Stack>
                        <Stack direction='column' alignItems='center' justifyContent='center'>
                            <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{(matches.league === 'others') ? matches.otherl : matches.league} </Typography>
                            <Divider sx={{ background: '#CACACA' }} />
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                                <p>|</p>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                            </Stack>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#CACACA', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                            </Stack>

                        </Stack>
                        <Divider sx={{ background: '#CACACA' }} />
                        <Stack direction='column' spacing={3}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#CACACA' }}>Match ID</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#CACACA' }}>{matches.match_id}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#CACACA' }}>Market</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#CACACA' }}>{markets[picked]}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#CACACA' }}>Odds</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#CACACA' }}>{tofal}</Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={{ background: '#CACACA' }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#CACACA', width: '210px' }}>Enter the amount you wish to stake</Typography>
                            {/* <Image src={Depx} alt="deposit" width={87} height={32} onClick={()=>{
                                router.push('/user/deposit')
                            }}/> */}
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#CACACA' }}>Account Balance</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#CACACA' }}>{ball} USDT</Typography>
                        </Stack>
                        <input placeholder='stake' type='text'
                            style={{ fontFamily: 'Poppins, sans-serif', padding: "10px", borderRadius: '12px', width: '100%', background: '#242627', color: '#FFFFFF', border: '3px solid #CACACA' }}
                            value={stake}
                            onChange={(e) => {
                                if (!isNaN(e.target.value)) {
                                    setStake(e.target.value)
                                }

                            }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#CACACA' }}>Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#CACACA' }}>{profit} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#CACACA' }}>Expected Profit</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#CACACA' }}>{expext} USDT</Typography>
                        </Stack>
                        <Button sx={{ fontFamily: 'Poppins,sans-serif', margin: '8px', fontSize: '16', fontWeight: '300', color: '#FFFFFF', background: "#E94E55", padding: '10px' }}
                            onClick={() => {
                                if (stake - 1 < info.balance) {
                                    if (stake < 1) {
                                        toast.error('You do not have sufficient balance for this transaction')
                                    } else {
                                        handleClose();
                                        handleOpenx()
                                        let balls = ball - stake;
                                        const deductBet = async () => {
                                            const { error } = await supabase
                                                .from('users')
                                                .update({ balance: balls })
                                                .eq('username', info.username)
                                            console.log(error)
                                            setMessages("Bet Successful")
                                            handleClick();
                                            handleClosex()
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
                                                    'profit': Number(((tofal * stake) / 100)).toFixed(2),
                                                    'aim': profit,
                                                    "home": matches.home,
                                                    "away": matches.away,
                                                    "time": matches.time,
                                                    "date": matches.date,
                                                    "odd": tofal,
                                                    "ihome": matches.ihome,
                                                    "iaway": matches.iaway
                                                })
                                            console.log(error)
                                        }
                                        const saveToUser = async () => {
                                            const { error } = await supabase
                                                .from('useractivity')
                                                .upsert({
                                                    'type': 'bets',
                                                    'amount': stake + (tofal * stake) / 100,
                                                    'user': info.username,
                                                    'match_id': display.matchId,
                                                    'stake': Number(stake),
                                                    'profit': Number(((tofal * stake) / 100)),
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

export async function getStaticPaths() {
    const { data, error } = await supabase
        .from('betz')
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
        .from('betz')
        .select()
        .eq('match_id', params.id)
    let matchDat = data;

    // Pass post data to the page via props
    return { props: { matchDat } }
}
