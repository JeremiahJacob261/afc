import { translateApiMessage } from '@/lib/translateApiMessage'
import { Typography, Stack, Divider, Button } from "@mui/material"
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import { supabase } from "@/pages/api/supabase"
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from 'uuid'
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock3 } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Cover from '../cover'
import { Drawer } from '@mui/material'
import toast, { Toaster } from "react-hot-toast";
import Image from 'next/image'
import Loading from "../../components/loading";
import Ims from '@/public/simps/ball.png'
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay';
import { waitForPaint } from '@/lib/uiFeedback';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/UserMatch.module.css';




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

// Identifies one bet attempt so a retry of the same selection is deduplicated
// by the server instead of placing a second bet. Always returns a real id —
// passing null would silently opt out of the protection.
function newClientBetId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return uuidv4()
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

export default function Match({ matchDat }) {
    const { t, i18n } = useTranslation('common')
    const router = useRouter()
    const initialMatch = Array.isArray(matchDat) && matchDat.length ? matchDat[0] : null
    // Guards against a double-tap placing two bets, and keeps a retry of the
    // same selection on one client_bet_id so the server deduplicates it.
    const betAttemptRef = useRef({ signature: '', id: null, pending: false });
    //snackbar1
    const [messages, setMessages] = useState("")
    const [opened, setOpened] = useState(false)
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });
    //end of snackbar1

    const [matches, setMatches] = useState(initialMatch || {})
    const [picked, setPicked] = useState('')
    const [bottom, setBottom] = useState(false)
    const [info, setInfo] = useState({});
    const [balance, setBalance] = useState(0);
    const [viplevel, setViplevel] = useState(1);



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
                setViplevel(result.vip?.viplevel || 1);
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
                <Head><title>{t('messages.unableLoadMatch')} — UCL</title></Head>
                <main className={styles.errorState}>
                    <h1>{t('messages.unableLoadMatch')}</h1>
                    <p>{t('errors.unableToLoad')}</p>
                    <Link href="/user/matches" className={styles.back}><ArrowLeft size={18} aria-hidden="true" /> {t('mobile.nav.matches')}</Link>
                </main>
            </Cover>
        )
    }

    return (
        <Cover>
            <Toaster position="bottom-center" reverseOrder={false} />
            <Loading open={openx} handleClose={handleClosex} />
            <Draws />
            <Sncks message={messages} />
            <Head>
                <title>{`${homeName} vs ${awayName} — UCL`}</title>
                <meta name="description" content="UCL football match markets" />
                <link rel="icon" href="/european.ico" />
            </Head>
            <main className={styles.page}>
                <Link href="/user/matches" className={styles.back}><ArrowLeft size={18} aria-hidden="true" /> {t('mobile.nav.matches')}</Link>
                <section className={styles.hero} aria-labelledby="match-title">
                    <div className={styles.heroMeta}>
                        <span>{leagueName}</span>
                        <span><Clock3 size={16} aria-hidden="true" /> {matchDisplay.dateTime} {t('website.localTime')}</span>
                    </div>
                    <div className={styles.heroBody}>
                        <span className={styles.teamCrest}><Image src={matches.ihome || Ims} width={64} height={64} alt="" unoptimized /></span>
                        <div className={styles.heroCopy}>
                            <h1 id="match-title">{homeName} <span>vs</span> {awayName}</h1>
                            <p>{t('mobile.match.matchId')} {matches.match_id || t('common.notAvailable')}</p>
                        </div>
                        <span className={styles.teamCrest}><Image src={matches.iaway || Ims} width={64} height={64} alt="" unoptimized /></span>
                    </div>
                    {matches.company && <p className={styles.company}>{matches.company}</p>}
                </section>

                <section className={styles.markets} aria-labelledby="markets-title">
                    <div className={styles.marketsHead}>
                        <div>
                            <h2 id="markets-title">{t('mobile.match.market')}</h2>
                            <p>{t('mobile.match.placeBet')}</p>
                        </div>
                    </div>
                    <div className={styles.marketGrid}>
                        {marketsArray.map((market) => {
                            const odd = getMatchOdd(matches, market.word, viplevel)
                            const isProtected = Boolean(matches.company) && matches.comarket === market.word
                            const label = market.word === 'otherscores' ? t('mobile.markets.other') : market.num
                            return <button
                                key={market.word}
                                type="button"
                                className={`${styles.marketCard} ${isProtected ? styles.protectedMarket : ''}`}
                                disabled={odd <= 0}
                                aria-label={odd > 0 ? `${label}, ${formatOdd(odd)}%. ${t('mobile.match.choose')}` : `${label}, ${t('mobile.match.marketUnavailable')}`}
                                onClick={() => { setPicked(market.word); setBottom(true) }}
                            >
                                <span className={styles.marketScore}>{label}</span>
                                <span className={styles.marketBottom}>
                                    <span>{isProtected ? t('mobile.match.companyGame') : t('landing.live.odds')}</span>
                                    <strong>{odd > 0 ? `${formatOdd(odd)}%` : '—'}</strong>
                                    <ChevronRight size={18} aria-hidden="true" />
                                </span>
                            </button>
                        })}
                    </div>
                </section>
            </main>
        </Cover>
    );
    function Draws() {
        const [stake, setStake] = useState('');
        const tofal = Number(getMatchOdd(matches, picked, viplevel).toFixed(3));
        const stakeFcfa = Number(stake || 0);
        const stakeAmount = stakeFcfa;
        const profit = Number(((stakeAmount * tofal) / 100).toFixed(3));
        const expext = Number((stakeAmount + profit).toFixed(3));
        let gcount = info.gcount ?? 0;
        const availableBalance = Math.max(0, Number(balance || 0));
        const availableStake = Number(availableBalance.toFixed(3));
        const useAllBalance = () => setStake(String(availableStake));

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
                PaperProps={{ sx: { width: 'min(100%, 560px)', mx: 'auto', maxHeight: '92dvh', overflowY: 'auto', borderRadius: '20px 20px 0 0', background: '#fdfcf8' } }}
                onClose={() => {
                    setBottom(false)
                }}
            >

                <div className={styles.betSlip}>
                    <Stack direction='column' spacing={2} className={styles.betSlipContent}>
                        <Stack direction='row' alignItems='center' spacing={1}>
                            <button type="button" className={styles.slipBack} aria-label={t('common.back')} onClick={() => {
                                setBottom(false)
                            }}><ArrowLeft size={20} aria-hidden="true" /></button>
                            <Typography component="h2" sx={{ fontFamily: 'Georgia,serif', fontSize: 24, color: '#080f32' }}>{t('mobile.match.placeBet')}</Typography>
                        </Stack>
                        <Stack direction='column' alignItems='center' justifyContent='center'>
                            <Typography style={{ color: '#080f32', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>{leagueName}</Typography>
                            <Divider sx={{ background: '#080f32' }} />
                        </Stack>
                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={3} className={styles.slipFixture}>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.ihome ? matches.ihome : Ims} width={50} height={50} alt='home' style={{ objectFit: 'contain' }} unoptimized />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Arial,sans-serif', color: '#080f32', fontSize: '12px', fontWeight: '100' }}>{homeName}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Arial,sans-serif', color: '#080f32', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.time}</Typography>
                                <p style={{ color: '#080f32' }}>|</p>
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Arial,sans-serif', color: '#080f32', fontSize: '14px', fontWeight: '100' }}>{matchDisplay.date}</Typography>
                            </Stack>
                            <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                <Image src={matches.iaway ? matches.iaway : Ims} width={50} height={50} alt='away' style={{ objectFit: 'contain' }} unoptimized />
                                <Typography sx={{ textAlign: 'center', fontFamily: 'Arial,sans-serif', color: '#080f32', fontSize: '12px', fontWeight: '100' }}>{awayName}</Typography>
                            </Stack>

                        </Stack>
                        <Divider sx={{ background: '#080f32' }} />
                        <Stack direction='column' spacing={3}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#080f32' }}>{t('mobile.match.matchId')}</Typography>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '500', color: '#080f32' }}>{matches.match_id || t('common.notAvailable')}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#080f32' }}>{t('mobile.match.market')}</Typography>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '500', color: '#080f32' }}>{picked === 'otherscores' ? t('mobile.markets.other') : markets[picked] || t('mobile.match.noMarketSelected')}</Typography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: 'bold', color: '#080f32' }}>{t('landing.live.odds')}</Typography>
                                <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: 16, fontWeight: 700, color: '#080f32' }}>{formatOdd(tofal)}%</Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={{ background: '#080f32' }} />
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '300', color: '#080f32', width: '210px' }}>{t('mobile.match.stakeAmount')}</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '300', color: '#080f32' }}>{t('common.currentBalance')}</Typography>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '500', color: '#080f32' }}>{availableStake.toLocaleString(i18n.language, { maximumFractionDigits: 3 })} MMK</Typography>
                        </Stack>
                        <input placeholder={t('mobile.match.stakeAmount')} aria-label={t('mobile.match.stakeAmount')} type='text' inputMode="decimal"
                            style={{ fontFamily: 'Arial, sans-serif', padding: "10px", borderRadius: '8px', width: '100%', minHeight: '48px', fontSize: '16px', background: '#fff', color: '#080f32', border: '1px solid #75886b' }}
                            value={stake}
                            onChange={(e) => {
                                if (!isNaN(e.target.value)) {
                                    setStake(e.target.value)
                                }

                            }} />
                        <Button
                            type="button"
                            variant="outlined"
                            disabled={availableStake <= 0}
                            onClick={useAllBalance}
                            sx={{ alignSelf: 'flex-start', borderColor: '#0649ff', color: '#0649ff', fontFamily: 'Arial,sans-serif', fontWeight: 600 }}
                        >
                            {t('mobile.match.useAllBalance')}
                        </Button>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '300', color: '#080f32' }}>{t('mobile.match.profit')}</Typography>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '500', color: '#080f32' }}>{profit.toLocaleString(i18n.language, { maximumFractionDigits: 3 })} MMK</Typography>
                        </Stack>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '600', color: '#080f32' }}>{t('mobile.match.expectedReturn')}</Typography>
                            <Typography sx={{ fontFamily: 'Arial,sans-serif', fontSize: '16', fontWeight: '600', color: '#080f32' }}>{expext.toLocaleString(i18n.language, { maximumFractionDigits: 3 })} MMK</Typography>
                        </Stack>
                        <Button disabled={openx} variant="contained" sx={{ fontFamily: 'Arial,sans-serif', minHeight: 48, fontSize: 16, fontWeight: 700, color: '#fff', background: "#0649ff", padding: '10px 16px', textTransform: 'none', '&:hover': { background: '#003bcc' } }}
                            onClick={() => {
                                if (openx) return
                                if (betAttemptRef.current.pending) return
                                if (!picked || tofal <= 0) {
                                    toast.error(t('messages.chooseScoreMarket'))
                                } else if (stakeAmount <= availableStake) {
                                    if (stakeAmount < 5000) {
                                        toast.error(t('messages.stakeMinimum'))

                                    }
                                    //for development purposes
                                    else if (stamx < currenv) {
                                        toast.error(t('mobile.match.matchExpired'))

                                    } else if (gcount > 2) {
                                        toast.error(t('mobile.match.maxBetsReached'));

                                    } else {
                                        // A retry of the same pick + stake reuses the
                                        // same id, so a dropped response cannot place
                                        // a second bet. Changing either starts a new one.
                                        const signature = `${picked}:${stakeFcfa}`
                                        if (betAttemptRef.current.signature !== signature) {
                                            betAttemptRef.current = { signature, id: newClientBetId(), pending: false }
                                        }
                                        const clientBetId = betAttemptRef.current.id
                                        betAttemptRef.current.pending = true
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
                                                        stake: stakeFcfa,
                                                        client_bet_id: clientBetId,
                                                        expected_odd: tofal,
                                                    }),
                                                })
                                                const result = await response.json().catch(() => ({}))
                                                if (!response.ok || result.status !== 'success') {
                                                    const isInsufficientBalance = /insufficient|not enough|enough\s+(?:MMK|USDT|FCFA)/i.test(String(result.message || ''))
                                                    toast.error(isInsufficientBalance ? t('mobile.match.insufficientBalance') : translateApiMessage(result, t, 'messages.unablePlaceBet'))
                                                    handleClosex()
                                                    if (/odds changed/i.test(String(result.message || ''))) {
                                                        router.replace(router.asPath)
                                                    }
                                                    return
                                                }

                                                setMessages(t('messages.betPlaced'))
                                                handleClick();
                                                router.push('/user/bets');
                                            } catch (error) {
                                                console.log(error)
                                                toast.error(t('messages.unablePlaceBet'))
                                                handleClosex()
                                            } finally {
                                                // Release the tap lock either way. The id stays
                                                // on the ref so a retry of the same pick + stake
                                                // is deduplicated by the server instead of
                                                // charged twice.
                                                betAttemptRef.current.pending = false
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
                </div>
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
