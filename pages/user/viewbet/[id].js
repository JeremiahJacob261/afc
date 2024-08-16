import { Typography, Stack, Divider, Button, Paper, Backdrop, CircularProgress } from "@mui/material"
import { supabase } from "../../api/supabase"
import { useState, useEffect } from 'react'
import Head from "next/head";
import { app } from '../../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";
export default function Viewbets({ bets }) {
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
        bets.map((m) => {
            setBet(m);
        })
        const useri = localStorage.getItem('signedIns');
        if (useri) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user

            const uid = localStorage.getItem('signUids');
            const name = localStorage.getItem('signNames');
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            console.log('...')
            // ...

            const GET = async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select()
                    .eq('userId', uid)
                setInfo(data[0]);
                console.log(data)
            }
            GET();


        } else {
            // User is signed out
            // ...
            signOut(auth);
            console.log('sign out');
            localStorage.removeItem('signedIns');
            localStorage.removeItem('signUids');
            localStorage.removeItem('signNames');
            router.push('/login');
        }


        const getMatchDa = async () => {
            try {

                const { data, error } = await supabase
                    .from('bets')
                    .select()
                    .eq('match_id', bet.match_id);
                data.map((m) => {
                    setLeague(m);
                })
            } catch (e) {
                console.log(e)
            }
        }
        getMatchDa();

    }, []);
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
        const { data, error } = await supabase
            .rpc('depositor', { amount: damount, names: dusername })
        console.log(error);
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
                <link rel="icon" href="/brentford.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Stack direction='row' sx={{ padding: '12px' }} onClick={() => {
                    router.back();
                }}>
                <KeyboardArrowLeftOutlinedIcon style={{ color: '#CACACA' }}  />
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
export async function getStaticPaths() {
    const { data, error } = await supabase
        .from('placed')
        .select()
    const paths = data.map((p) => ({
        params: { id: p.betid },
    }))



    return { paths, fallback: true }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
    // params contains the post `id`.
    // If the route is like /posts/1, then params.id is 1
    const { data, error } = await supabase
        .from('placed')
        .select()
        .eq('betid', params.id)
    let bets = data;
    // Pass post data to the page via props
    return { props: { bets } }
}
