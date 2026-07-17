import { Typography, Stack, Divider, Button, Paper } from "@mui/material"
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
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
import Bal from '@/public/bball.png'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay';
import { waitForPaint } from '@/lib/uiFeedback';
import { useTranslation } from 'next-i18next';




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
    '2': 0.10,
    '3': 0.20,
    '4': 0.33,
    '5': 0.47,
    '6': 0.63,
    '7': 0.83
}

function getMatchOdd(match, market, level) {
    const baseOdd = Number(match?.[market] || 0)
    const vipIncrease = Number(vip[level] || 0)
    const value = baseOdd * (1 + vipIncrease)
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
    const timestamp = getMatchStartMs(match)
    return timestamp ? timestamp / 1000 : 0
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

// ─── Liquid glow animation keyframes ─────────────────────────────────────────
// The inset shadow shifts vertically (top ↔ bottom) to simulate liquid sloshing
// inside the container; the outer glow pulses in sync to radiate outward.
const liquidBoxShadow = [
    'inset 0 0 10px 3px rgba(178,34,34,0.20), 0 0 8px 2px rgba(178,34,34,0.38)',
    'inset 0 5px 22px 7px rgba(210,52,20,0.55), 0 0 18px 5px rgba(204,44,18,0.72)',
    'inset 0 -5px 20px 7px rgba(190,38,14,0.48), inset 0 3px 12px 4px rgba(215,58,22,0.32), 0 0 14px 4px rgba(192,40,16,0.58)',
    'inset 0 5px 22px 7px rgba(210,52,20,0.55), 0 0 18px 5px rgba(204,44,18,0.72)',
    'inset 0 0 10px 3px rgba(178,34,34,0.20), 0 0 8px 2px rgba(178,34,34,0.38)',
]

const liquidTransition = {
    duration: 2.8,
    repeat: Infinity,
    ease: 'easeInOut',
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Match({ matchDat }) {
    const { t } = useTranslation('common')
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
                toast.error(t('messages.unableRefreshAccount'))
            }
        }

        GET();

        return () => {
            active = false;
        }
    }, [initialMatch, router, t]);

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
    const matchDisplay = useClientMatchDisplay(matches)
    const leagueName = getLeagueName(matches)
    const homeName = getTeamName(matches.home, t('common.home'))
    const awayName = getTeamName(matches.away, t('common.away'))

    if (!initialMatch) {
        return (
            <Cover>
                <Stack style={{ width: "100%", minHeight: '100vh', background: '#06101F', padding: '24px' }} alignItems="center" justifyContent="center" spacing={2}>
                    <Head>
                        <title>{t('messages.unableLoadMatch')}</title>
                        <link rel="icon" href="/european.ico" />
                    </Head>
                    <Typography sx={{ color: '#E9E5DA', fontFamily: 'Poppins,sans-serif', fontWeight: '600' }}>{t('messages.unableLoadMatch')}</Typography>
                    <Typography sx={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '13px', textAlign: 'center' }}>
                        {t('errors.unableToLoad')}
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/user/matches')} sx={{ background: '#1BB6FF', color: '#06101F' }}>
                        {t('common.back')}
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
                    <title>{`${homeName} VS ${awayName}`}</title>
                    <meta name="description" content="A Premium EFC  match" />
                    <link rel="icon" href="/european.ico" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <Stack direction='row' alignItems='left' justifyContent='left' spacing={1} sx={{ width: '100%', margin: '5px' }} onClick={() => { router.push('/user/matches') }}>
                    <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px', color: '#E9E5DA' }} />
                    <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontWeight: '300', width: '90%', textAlign: 'center' }}>{t('mobile.match.placeBet')}</Typography>
                </Stack>


                <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'

                    style={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'space-between',
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
                            <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' style={{ borderRadius: '10px', objectFit: 'contain' }} unoptimized />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{homeName}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.time}</Typography>
                            <p style={{ color: '#E9E5DA' }}>|</p>
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.date}</Typography>
                        </Stack>
                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                            <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' style={{ borderRadius: '10px', objectFit: 'contain' }} unoptimized />
                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{awayName}</Typography>
                        </Stack>
                    </Stack>
                    <Divider sx={{ background: '#E9E5DA' }} />
                    <p>{matches?.company ? matches.company : t('common.no')}</p>
                    {
                        marketsArray.map((m) => {
                            // ── Protection check ──────────────────────────────────────────────
                            // A market is "company protected" when matches.company is truthy
                            // AND this row's key matches the comarket field.
                            const isProtected = Boolean(matches.company) && matches.comarket === m.word

                            return (
                                <Stack direction="column" spacing={1} key={m.num} style={{ width: '100%' }}>
                                    {/*
                                     * Outer motion.div handles the liquid-glow effect:
                                     *   • inset boxShadow shifts top ↔ bottom  → liquid sloshing
                                     *   • outer boxShadow pulses               → radiating brick-red light
                                     * A secondary motion.div sweeps a gradient across like flowing lava.
                                     */}
                                    <motion.div
                                        animate={isProtected ? { boxShadow: liquidBoxShadow } : {}}
                                        transition={isProtected ? liquidTransition : {}}
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderRadius: '8px',
                                            border: isProtected
                                                ? '1px solid rgba(0, 202, 229, 0.55)'
                                                : '1px solid transparent',
                                            background: isProtected
                                                ? 'rgba(32, 255, 244, 0.22)'
                                                : 'transparent',
                                        }}
                                    >
                                        {/* Liquid shimmer sweep – only rendered when protected */}
                                        {isProtected && (
                                            <motion.div
                                                animate={{ x: ['-130%', '230%'] }}
                                                transition={{
                                                    duration: 2.8,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut',
                                                    repeatDelay: 0.2,
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '60%',
                                                    height: '100%',
                                                    background:
                                                        'linear-gradient(90deg, transparent, rgba(20, 185, 210, 0.16), rgba(26, 211, 228, 0.3), rgba(20, 178, 210, 0.16), transparent)',
                                                    pointerEvents: 'none',
                                                    zIndex: 0,
                                                }}
                                            />
                                        )}

                                        {/* Row content sits above the shimmer layer */}
                                        <Stack
                                            style={{
                                                minWidth: '300px',
                                                height: '44px',
                                                display: 'flex',
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                position: 'relative',
                                                zIndex: 1,
                                                padding: '0 4px',
                                            }}
                                        >
                                            {/* Score label + optional badge */}
                                            <Stack direction='row' alignItems='center' spacing={0.5}>
                                                <p
                                                    style={{
                                                        color: isProtected ? '#7af6ff' : '#E9E5DA',
                                                        padding: '8px',
                                                        fontWeight: isProtected ? '600' : '400',
                                                        margin: 0,
                                                    }}
                                                >
                                                    {m.word === 'otherscores' ? t('mobile.markets.other') : m.num}
                                                </p>
                                                {isProtected && (
                                                    <motion.span
                                                        animate={{ opacity: [0.65, 1, 0.65] }}
                                                        transition={{
                                                            duration: 1.6,
                                                            repeat: Infinity,
                                                            ease: 'easeInOut',
                                                        }}
                                                        style={{
                                                            fontSize: '8px',
                                                            color: '#00fffb',
                                                            fontFamily: 'Poppins, sans-serif',
                                                            fontWeight: '700',
                                                            letterSpacing: '0.06em',
                                                            textTransform: 'uppercase',
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {t('mobile.match.companyGame')}
                                                    </motion.span>
                                                )}
                                            </Stack>

                                            {/* Odds */}
                                            <p style={{ color: '#1BB6FF', padding: '8px', margin: 0 }}>
                                                {formatOdd(getMatchOdd(matches, m.word, viplevel))}%
                                            </p>

                                            {/* Choose button */}
                                            <motion.div
                                                onClick={() => {
                                                    if (getMatchOdd(matches, m.word, viplevel) <= 0) {
                                                        toast.error(t('mobile.match.marketUnavailable'))
                                                        return
                                                    }
                                                    setPicked(m.word)
                                                    setBottom(true)
                                                }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                style={{
                                                    cursor: 'pointer',
                                                    color: '#06101F',
                                                    background: '#1BB6FF',
                                                    padding: '4px 8px',
                                                    borderRadius: '5px',
                                                }}
                                            >
                                                {t('mobile.match.choose')}
                                            </motion.div>
                                        </Stack>
                                    </motion.div>
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
                            <Typography sx={{ width: '100%', fontFamily: 'Poppins,sans-serif', textAlign: 'center', color: '#E9E5DA' }}>{t('mobile.match.placeBet')}</Typography>
                        </Stack>
                        <Stack direction='column' alignItems='center' justifyContent='center'>
                            <Typography style={{ color: '#E9E5DA', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{leagueName}</Typography>
                            <Divider sx={{ background: '#E9E5DA' }} />
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' style={{ objectFit: 'contain' }} unoptimized />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{homeName}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.time}</Typography>
                                <p style={{ color: '#E9E5DA' }}>|</p>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.date}</Typography>
                            </Stack>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' style={{ objectFit: 'contain' }} unoptimized />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA', fontSize: '12px', fontWeight: '100' }}>{awayName}</Typography>
                            </Stack>

                        </Stack>
                        <Divider sx={{ background: '#E9E5DA' }} />
                        <Stack direction='column' spacing={3}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>{t('mobile.match.matchId')}</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{matches.match_id || t('common.notAvailable')}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>{t('mobile.match.market')}</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{picked === 'otherscores' ? t('mobile.markets.other') : markets[picked] || t('mobile.match.noMarketSelected')}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#E9E5DA' }}>{t('landing.live.odds')}</Typography>
                                <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{formatOdd(tofal)}</Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={{ background: '#E9E5DA' }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA', width: '210px' }}>{t('mobile.match.stakeAmount')}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA' }}>{t('common.currentBalance')}</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{ball.toFixed(3)} USDT</Typography>
                        </Stack>
                        <input placeholder={t('mobile.match.stakeAmount')} type='text'
                            style={{ fontFamily: 'Poppins, sans-serif', padding: "10px", borderRadius: '12px', width: '100%', background: '#06101F', color: '#FFFFFF', border: '3px solid #E9E5DA' }}
                            value={stake}
                            onChange={(e) => {
                                if (!isNaN(e.target.value)) {
                                    setStake(e.target.value)
                                }

                            }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '300', color: '#E9E5DA' }}>{t('mobile.match.profit')}</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '500', color: '#E9E5DA' }}>{profit.toFixed(3)} USDT</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>{t('mobile.match.expectedReturn')}</Typography>
                            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '16', fontWeight: '600', color: '#E9E5DA' }}>{expext.toFixed(3)} USDT</Typography>
                        </Stack>
                        <Button disabled={openx} sx={{ fontFamily: 'Poppins,sans-serif', margin: '8px', fontSize: '16', fontWeight: '300', color: '#06101F', background: "#1BB6FF", padding: '10px' }}
                            onClick={() => {
                                if (openx) return
                                if (!picked || tofal <= 0) {
                                    toast.error(t('messages.chooseScoreMarket'))
                                } else if (stakeAmount - 1 < Number(info.balance || 0)) {
                                    if (stakeAmount < 1) {
                                        toast.error(t('messages.stakeMinimum'))

                                    }
                                    //for development purposes
                                    else if (stamx < currenv) {
                                        toast.error(t('mobile.match.matchExpired'))

                                    } else if (gcount > 2) {
                                        toast.error(t('mobile.match.maxBetsReached'));

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
                                                    toast.error(result.message || t('messages.unablePlaceBet'))
                                                    handleClosex()
                                                    return
                                                }

                                                setMessages(result.message || t('messages.betPlaced'))
                                                handleClick();
                                                router.push('/user/bets');
                                            } catch (error) {
                                                console.log(error)
                                                toast.error(t('messages.unablePlaceBet'))
                                                handleClosex()
                                            }
                                        }
                                        deductBet();
                                    }
                                } else {
                                    toast.error(t('mobile.match.insufficientBalance'));
                                }
                            }}
                        >
                            {openx ? t('mobile.match.placingBet') : t('mobile.match.placeBet')}
                        </Button>
                    </Stack>
                </Cover>
            </Drawer>
        )
    }
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
    try {
        const id = context.params?.id;
        if (!id) {
            return { props: {
      ...i18nProps, matchDat: [] } }
        }

        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id)
            .maybeSingle();

        if (error) {
            console.error('Unable to load match:', error);
            return { props: {
      ...i18nProps, matchDat: [] } }
        }

        return { props: {
      ...i18nProps, matchDat: data ? [data] : [] } }
    } catch (error) {
        console.error('Match page error:', error);
        return { props: {
      ...i18nProps, matchDat: [] } }
    }
}
