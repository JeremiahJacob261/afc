import { Typography, Stack, Divider, Button, Paper, Backdrop, CircularProgress } from "@mui/material"
import { supabase } from "@/pages/api/supabase"
import { useState, useEffect } from 'react'
import Head from "next/head";
import { app } from '@/pages/api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';

export default function Viewbets() {
    const [drop, setDrop] = useState(false)
    const [league, setLeague] = useState([]);
    const [bet, setBet] = useState({})
    const router = useRouter();
    const auth = getAuth(app);
    const [info, setInfo] = useState({});
    let stams = Date.parse(bet.date + " " + bet.time) / 1000;
    let curren = new Date().getTime() / 1000;
    const [btn, setBtn] = useState((stams > curren) ? 'none' : 'visible');
    const [status, setStatus] = useState('');
    useEffect(() => {
        let active = true;

        const GET = async () => {
            const session = await requireSession(router);
            if (!session) return;
            clearLegacyAuthStorage();

            try {
                const response = await authFetch('/api/my-bet?id=' + router.query.id);
                if (response.status === 401 || response.status === 404) {
                    router.push(response.status === 401 ? '/login' : '/user/bets');
                    return;
                }

                const result = await response.json();
                if (!active || result.status !== 'success') return;

                setBet(result.bet || {});
                setLeague(result.match || {});
            } catch (e) {
                console.log(e);
            }
        }
        if (router.query.id) GET();

        return () => {
            active = false;
        }
    }, [router]);
    const NUser = async (reason, username, amount) => {
        const { error } = await supabase
            .from('activa')
            .insert({
                'code': reason,
                'username': username,
                'amount': amount
            });
    }
    const Depositing = async (damount, dusername) => {
        try {
            await fetch('/api/rpc/depositor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: dusername, amount: damount })
            })
        } catch (e) { console.log(e) }
    }

    return (
        <div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={drop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Head>
                <title>Bet Details</title>
                <meta name="description" content="Login to your Account to see more info about your bets" />
                <link rel="icon" href="/european.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Stack direction='row' sx={{ padding: '12px' }} onClick={() => {
                router.back();
            }}>
                <KeyboardArrowLeftOutlinedIcon style={{ color: '#CACACA' }} />
                <p style={{ width: '100%', fontFamily: 'Poppins,sans-serif', textAlign: 'center', color: '#CACACA' }}>go back to bets</p>
            </Stack>
            <Stack direction="column" sx={{ padding: '10px', minHeight: '100vh' }} spacing={2}>
                <Typography style={{ color: '#EE8F00', fontFamily: 'Poppins,sans-serif', width: '100%', textAlign: 'center', fontSize: '20px' }}>Bet Details</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Match Name : {bet.home} vs {bet.away}</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>{bet.home} vs {bet.away}</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Stake : {bet.stake} USDT</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Time : {bet.time}</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Date : {bet.date} </Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>%odds : {bet.odd}%</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>League Name:{(league.league === 'other') ? league.league : league.otherl}</Typography>

                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Market Chosen : {bet.market}</Typography>
                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins, sans-serif' }}>Potential Winnings : {bet.aim} USDT</Typography>
                <Stack direction="row" justifyContent="space-between">
                    <Typography direction="column" style={{ color: 'yellow', fontFamily: 'Poppins, sans-serif' }}>Results</Typography>

                    <Typography style={{ color: 'yellow', fontFamily: 'Poppins, sans-serif', backgroundColor: '#F05D5E', padding: '5px', borderRadius: '8px', margin: '3px' }}>
                        {(stams > curren) ? 'Not Started' : (bet.won === 'null') ? 'Processing' : (bet.won === 'true') ? 'Won' : 'Lost'}
                    </Typography>
                </Stack>
                <Button variant='standard' style={{ color: '#F05D5E', display: (stams < curren) ? 'none' : 'visible' }} onClick={() => {

                }}>Cancel this bet - Please Contact Admin to remove this bet</Button>
            </Stack>
        </div>
    )
    function Btns() {
        if (stams < curren) {
            return (
                <Button variant='standard' style={{ color: '#F05D5E', display: 'none' }} onClick={() => {
                    //  setDrop(true);
                    //  Depositing(bet.stake, info.username);
                    //  const rem = async () => {

                    //     const { error } = await supabase
                    //         .from('placed')
                    //         .delete()
                    //         .eq('betid', bet.betid);
                    // }
                    // rem();
                    //  setDrop(false);
                    //  router.push('/user/bets');
                }}>Cancel this bet - Please Contact Admin to remove this bet</Button>
            )
        } else {
            return (
                <Button variant='standard' style={{ color: '#F05D5E', }} onClick={() => {
                    // setDrop(true);
                    //  const rem = async () => {

                    //      const { error } = await supabase
                    //          .from('placed')
                    //          .delete()
                    //          .eq('betid', bet.betid);
                    //  }
                    //  rem();
                    //  Depositing(bet.stake, info.username);
                    // setDrop(false);
                    //  router.push('/user/matches');
                }}>Cancel this bet - Please Contact Admin to remove this bet</Button>
            )
        }

    }
}
