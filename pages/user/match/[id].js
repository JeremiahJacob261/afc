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
import { AppContext, BetContext, SlipContext } from "../../api/Context";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

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
    const { bets, setBets } = useContext(BetContext)
    const [info, setInfo] = useState({});
    const { slip, setSlip } = useContext(SlipContext);

    useEffect(() => {
        const GET = async () => {
            const { data, error } = await supabase
                .from('users')
                .select()
                .eq('username', localStorage.getItem('me'))
            console.log(data[0])
            setInfo(data[0])
        }
        GET();
        matchDat.map((m) => {
            setMatches(m)
        })
        if (localStorage.getItem('me') === null) {
            router.push("/login")
        }
    }, [])
    const router = useRouter()
    const markets = [
        {
            "title": "0 - 0",
            "odds": "nilnil"
        },
        {
            "title": "1 - 0",
            "odds": "onenil"
        },
        {
            "title": "0 - 1",
            "odds": "nilone"
        },
        {
            "title": "1 - 1",
            "odds": "oneone"
        },
        {
            "title": "2 - 0",
            "odds": "twonil"
        },
        {
            "title": "0 - 2",
            "odds": "niltwo"
        },
        {
            "title": "2 - 1",
            "odds": "twoone"
        },
        {
            "title": "1 - 2",
            "odds": "onetwo"
        },
        {
            "title": "2 - 2",
            "odds": "twotwo"
        },
        {
            "title": "3 - 0",
            "odds": "threenil"
        },
        {
            "title": "0 - 3",
            "odds": "nilthree"
        },
        {
            "title": "3 - 1",
            "odds": "threeone"
        },
        {
            "title": "1 - 3",
            "odds": "onethree"
        },
        {
            "title": "2 - 3",
            "odds": "twothree"
        },
        {
            "title": "3 - 2",
            "odds": "threetwo"
        },
        {
            "title": "3 - 3",
            "odds": "threethree"
        },
        {
            "title": "Other",
            "odds": "otherscores"
        }
    ]
    //dialog-start
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    function DisplayDialog() {
        const [stake, setStake] = useState(0)
        const [ball, setBall] = useState();
        let profit = Number((display.odds * stake) / 100)+ Number(stake);
        const GET = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('balance')
                .eq('username', localStorage.getItem('me'))
            setBall(data[0].balance)
        }
        GET();
        console.log(info.balance)
        return (
            <Dialog open={open} onClose={handleClose} style={{ minWidth: "300px", padding: "8px" }}>
                <div style={{display:'flex',justifyContent:'center',color:'#F2E94E',padding:'5px',fontFamily: 'Poppins, sans-serif'}}>
                <h3>{display.league}</h3></div>
                <DialogTitle sx={{ color: "#1B5299", fontFamily: 'Caveat, cursive', fontSize: "25px" }}>{display.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>Match Id :
                        {display.matchId}</DialogContentText>
                    <Stack direction="column" spacing={3}>
                        <Typography>
                            Market : {display.market_picked}
                        </Typography>
                        <Typography>Profit : {display.odds}%</Typography>
                        <Typography variant="caption">input the amount your wish to stake</Typography>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <TextField label="Amount" type="number" value={stake} onChange={(st) => {
                                setStake(st.target.value)
                            }} />
                            <Typography>USDT</Typography>
                        </Stack>
                        <Button variant="outlined">
                            <Typography variant="caption" onClick={() => {
                                setStake(ball)
                            }}>Bet all Balance</Typography>
                        </Button>
                        <Typography>Profit : {Number(((display.odds * stake) / 100))} USDT</Typography>
                        <Typography>Total Money to Be Made : {profit} USDT</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>exit</Button>
                    <Button variant="contained" onClick={() => {
                        if (stake - 1 < ball) {
                            handleClose()
                            setBall(ball - stake)
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
                                        'match_id': display.matchId,
                                        'market': display.market_picked,
                                        'username': info.username,
                                        'started': false,
                                        'stake': Number(stake),
                                        'profit': Number(((display.odds * stake) / 100)),
                                        'aim': profit,
                                        "home": display.home,
                                        "away": display.away
                                    })
                                console.log(error)
                            }
                            const saveToUser = async () => {
                                const { error } = await supabase
                                    .from('useractivity')
                                    .upsert({
                                        'type': 'bets',
                                        'amount': stake + (display.odds * stake).toFixed(2) / 100,
                                        'user': localStorage.getItem('me'),
                                        'match_id': display.matchId,
                                        'stake': Number(stake),
                                        'profit': Number(((display.odds * stake) / 100)),
                                        'market': display.market_picked
                                    })
                                console.log(error)
                            }
                            saveToUser()
                            deductBet()
                            saveToDB()

                        } else {
                            alert("You do not have Enough USDT to Complete this BET");
                        }

                    }}>BET</Button>
                </DialogActions>
            </Dialog>
        )
    }
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
    //main ui
    return (
        <Stack style={{ width: "100%" }} alignItems="center">
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
            <DisplayDialog />
            <Paper elevation={4} sx={{ width: "100%" }}>
                <Stack style={{ background: "#1B5299", width: "100%", padding: "8px" }} alignItems="center">
                    <KeyboardBackspaceIcon sx={{ color: "white" }} onClick={() => {
                        setDrop(true)
                        router.push("/user/matches")

                        //back to home
                    }} />
                    <Typography sx={{ fontFamily: 'Marhey, cursive', color: "white" }}>{matches.home} VS {matches.away}</Typography>
                    <Typography sx={{ color: "whitesmoke", fontSize: 15 }}>Match Id: {matches.match_id}</Typography>
                </Stack>

            </Paper>

            <Stack direction="row" spacing={3} justifyContent="center" alignItems="flex-start" sx={{ marginTop: "100px", width: "340px" }}>
                <Stack direction="column">
                    {//market
                    }

                    {
                        markets.map((m) => {
                            return (
                                <Stack direction="column" key={m.title}>
                                    <Stack sx={{ padding: "8px", width: "100%" }} direction="row" spacing={10} justifyContent="space-between">
                                        <Typography sx={{ color: "white" }}>{m.title}</Typography>
                                        <Typography sx={{ color: "#06D6A0" }}>{matches[m.odds]}%</Typography>
                                        <Button sx={{ padding: "3px", height: "18px" }} variant="contained" disableElevation
                                            onClick={() => {
                                                setDisplay(
                                                    {
                                                        "title": matches.home + " VS " + matches.away,
                                                        "market_picked": m.title,
                                                        "odds": matches[m.odds],
                                                        "matchId": matches.match_id,
                                                        "home": matches.home,
                                                        "away": matches.away,
                                                        "league":matches.league
                                                    }
                                                )
                                                setOpen(true)
                                            }}
                                        >
                                            <Typography variant="caption">choose</Typography>
                                        </Button>
                                    </Stack>
                                    <Divider style={{ background: "whitesmoke" }} />
                                </Stack>
                            )
                        })
                    }

                </Stack>
            </Stack>
        </Stack>
    )
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
