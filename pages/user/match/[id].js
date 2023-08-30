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
import { app } from '../../api/firebase';
import Image from 'next/image'
import Ims from '../../../public/simps/ball.png'
import Bal from '../../../public/bball.png'
import { onAuthStateChanged } from "firebase/auth";
import { getAuth,signOut } from "firebase/auth";
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
    const [info, setInfo] = useState({});
const auth = getAuth(app);
const Reads = async (dtype,damount) => {
    const { data, error } = await supabase
      .rpc(dtype, { amount: damount})
    console.log(error);
  }
useEffect(() => {

    matchDat.map((m) => {
        setMatches(m)
    })
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        // ...
        console.log(user)
        const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('userId', user.uid)
          setInfo(data[0])
          console.log(data)
        }
        GET();
      } else {
        // User is signed out
        // ...
        console.log('sign out');
        router.push('/login');
      }
    });
  }, []);
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
        const [stake, setStake] = useState(null)
        const [ball, setBall] = useState(info.balance);
        let profit = ((display.odds * stake) / 100)+ stake;
        useEffect(()=>{

//         const GET = async () => {
//             try{
// const { data, error } = await supabase
//                 .from('users')
//                 .select('balance')
//                 .eq('username', localStorage.getItem('me'))
//             setBall(data[0].balance)
//         console.log(info[0].balance)
//             }catch(e){
                
//             }
            
//         }
//         GET();
        },[setBall])
        return (
            <Dialog open={open} onClose={handleClose} style={{ minWidth: "300px", padding: "8px" }}>
                <div style={{display:'flex',justifyContent:'center',color:'#F2E94E',padding:'5px',fontFamily: 'Poppins, sans-serif'}}>
                <h4>{display.league}</h4></div>
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
                                setStake(Number(st.target.value))
                            }} />
                            <Typography>USDT</Typography>
                        </Stack>
                        <Button variant="outlined">
                            <Typography variant="caption" onClick={() => {
                                setStake(ball)
                            }}>Bet all Balance</Typography>
                        </Button>
                        <Typography>Profit : {((display.odds * stake) / 100).toFixed(2)} USDT</Typography>
                        <Typography>Total Money to Be Made : {(profit).toFixed(2)} USDT</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>exit</Button>
                    <Button variant="contained" onClick={() => {
                        if (stake - 1 < ball) {
                           if(stake < 1){
                            alert('You do not have sufficient balance for this transaction')
                           }else{
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
                                        'profit': Number(((display.odds * stake) / 100)).toFixed(2),
                                        'aim': profit,
                                        "home": display.home,
                                        "away": display.away,
                                        "time":display.time,
                                        "date":display.date,
                                        "odd":display.odds
                                    })
                                console.log(error)
                            }
                            const saveToUser = async () => {
                                const { error } = await supabase
                                    .from('useractivity')
                                    .upsert({
                                        'type': 'bets',
                                        'amount': stake + (display.odds * stake) / 100,
                                        'user': info.username,
                                        'match_id': display.matchId,
                                        'stake': Number(stake),
                                        'profit': Number(((display.odds * stake) / 100)),
                                        'market': display.market_picked
                                    })
                                console.log(error)
                            }
                            saveToUser();
                            deductBet();
                            saveToDB();
                            Reads('readbet',stake);
                            router.push('/user/matches');
                           }
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
    let stams = Date.parse(matches.date + " " + matches.time) / 1000;
    let curren = new Date().getTime() / 1000;
    const league = (matches.league === 'others') ? matches.otherl : matches.league;
    console.log(new Date(matches.date))
    console.log(new Date(matches.time))
    let date = parseInt(new Date(matches.date).getMonth() + 1);
    let day = new Date(matches.date).getDate();
    let time = matches.time;
    
    //main ui
    return (
        <Stack style={{ width: "100%",height:'100%',background:'#FFFFFF' }} alignItems="center">
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
            <Stack direction='row' alignItems='center' spacing={1} sx={{padding:'5px',margin:'2px'}}>
        <KeyboardArrowLeftOutlinedIcon sx={{width:'24px',height:'24px'}}/>
        <Typography sx={{fontSize:'16px',fontFamily:'Poppins,sans-serif',fontWeight:'300',width:'90%',textAlign:'center'}}>Stake your bet</Typography>
        </Stack>
       

                <Stack direction="column" spacing={2} justifyContent='center' alignItems='center'
                  key={"match" + matches.home + matches.away}
                  style={{
                    marginBottom: "8px", padding: "18.5px",
                    display: (stams < curren) ? 'none' : 'visible',
                    background: '#F5F5F5',
                    width: '343px',
                    borderRadius: '5px',
                    height: '204px'
                  }} onClick={() => {
                    setDrop(true)
                    //register/000208
                    router.push("/user/match/" + matches.match_id)
                  }}>
                  <Stack direction='column'>
                    <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>{league} </Typography>
                    <Divider sx={{ background: 'black' }} />
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                  <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={Ims} width={50} height={50} alt='home'/>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.home}</Typography>
                  </Stack>
                  <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{time}</Typography>
                   <p>|</p>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }}>{date}/{day}</Typography>
                  </Stack>
                  <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={Ims} width={50} height={50} alt='away'/>
                    <Typography sx={{ textAlign:'center',fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }}>{matches.away}</Typography>
                  </Stack>
                  </Stack>
                  <Divider sx={{background:'black',opacity:'0.7'}}/>
                  <Stack direction='column'>
                  <Stack direction='row'> 
                  <Image src={Bal} width={24} height={24}/>
                  <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}>Home Picks</Typography>
                  </Stack>
                    
                    <Stack direction='row'> </Stack>
                  </Stack>
                </Stack>

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
                                                        "league":(matches.league === 'others') ? matches.otherl : matches.league,
                                                        "time":matches.time,
                                                        "date":matches.date,
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
