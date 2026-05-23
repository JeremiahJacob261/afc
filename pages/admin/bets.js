import { Stack, Typography, Box, Button, TextField, Checkbox } from "@mui/material";
import { callAdminRpc } from '@/lib/adminRpcClient';
import { supabase } from '@/pages/api/supabase'
import PageviewIcon from '@mui/icons-material/Pageview';
import PreviewIcon from '@mui/icons-material/Preview';
import { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import Cover from './cover'
import { motion } from "framer-motion";
export default function Bets({ bets }) {
    const [open, setOpen] = useState(false);
    const [quest, setQuest] = useState(false)
    const [display, setDisplay] = useState({})
    const [drop, setDrop] = useState(false);
    const [matchid, setMatchid] = useState('')
    const [home, setHome] = useState(0)
    const [away, setAway] = useState(0)
    const [cGame, setCGame] = useState('');
    const [check, setCheck] = useState(false);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() is zero-based
    const dayt = today.getDate() + 1;
    const dateTomo = `${year}-${month}-${(dayt < 10) ? '0' + dayt : dayt}`;
    // const reward_upline = async () => {
    //     try{

    //         const { data, error } = await supabase
    //             .from('users')
    //             .select('*')
    //             .eq('username', 'lesanmi');
    //         let aff = (data ? data : [])[0];
    //         console.log(aff);
    //         AffBonus(parseFloat(2.3), aff.username, aff.refer, aff.lvla, aff.lvlb);

    //     }catch(e){
    //         console.log(e);
    //     }    
    //     }
    //     reward_upline();
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const handleClosed = () => {
        setQuest(false);
    };

    const Reads = async (dtype, damount) => {
        const { data, error } = await callAdminRpc(dtype, { amount: damount })
        console.log(error);
    }
    const Chan = async (bets, type) => {
        const { data, error } = await callAdminRpc('chan', { bet: bets, des: type })
        console.log(error);
    }
    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
        try {
            const { data, error } = await callAdminRpc('affbonus', { name: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
            console.log(error);
        } catch (e) {
            console.log(e)
        }

    }
    const NUser = async (reason, username, amount) => {
        const { error } = await supabase
            .from('activa')
            .insert({
                'code': reason,
                'username': username,
                'amount': amount
            });
    }
    //funct6ions
    async function funct(reslut, id) {
        const { data, error } = await supabase.functions.invoke('hello-world', {
            body: {
                match: id,
                reslut: reslut
            },
        })
        console.log(data)
        console.log(error)
    }

    //verify if the user has won the bet
    const Verify = async (reslut, id) => {
        console.log('Verifying...')
        const { error } = await supabase
            .from('bets')
            .update({
                'verified': true,
                'results': reslut
            })
            .eq('match_id', id);
        console.log(error);
        let market = reslut;
        const updateBalance = async (id, market) => {
            const { data, error } = await supabase
                .from('placed')
                .select('*')
                .match({
                    'match_id': id
                });
            console.log(data);
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                console.log(d);
                try {
                    if (d.market === market) {
                        console.log((d.market === market) ? 'true' : 'false');
                        const inBal = async () => {
                            const { data, error } = await callAdminRpc('depositor', { amount: Number(d.aim) + Number(d.stake), names: d.username })
                            console.log(error)
                        }
                        Reads('readwon', d.aim)
                        inBal()
                        Chan(d.betid, 'true');
                        const reward_upline = async () => {
                            try {

                                const { data, error } = await supabase
                                    .from('users')
                                    .select('*')
                                    .eq('username', d.username);
                                let aff = data[0];
                                console.log(aff);
                                AffBonus(parseFloat(d.profit), d.username, aff.refer, aff.lvla, aff.lvlb);

                            } catch (e) {
                                console.log(e);
                            }
                        }
                        NUser('bet', d.username, Number(d.aim) + Number(d.stake))
                        reward_upline();
                    } else {
                        Chan(d.betid, 'false');
                    }
                } catch (e) {
                    console.log(e);
                }
            }



            setHome(0)
            setAway(0)
        }

        setDrop(false)
        updateBalance(id, market);


    }
    //verify if the bet is a company bet then retrn the stake to the user
    const VerifyN = async (reslut, id) => {
        console.log('Verifying...')
        let market = reslut;
        const updateBalance = async (id, market) => {
            const { data, error } = await supabase
                .from('placed')
                .select()
                .match(
                    {
                        'match_id': id,
                    }
                )
            data.map((d) => {
                console.log(d);
                if (d.market != market) {

                    const inBal = async () => {
                        const { data, error } = await callAdminRpc('depositor', { amount: Number(d.stake), names: d.username })
                        console.log(error)
                    }
                    Reads('readwon', d.stake)
                    inBal()
                }
            })

        }
        updateBalance(id, market)
    }
    useEffect(() => {

    }, [])
    function DisplayDialog() {
        const [match, setMatch] = useState([])
        const getData = async () => {
            const { data, error } = await supabase
                .from('placed')
                .select()
                .eq('match_id', display.match)
            setMatch(data)
        }
        getData()
        let matchs = match
        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>List of Bets Placed</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This dialog shows the list of people who placed the Bets</DialogContentText>
                    <Stack>
                        {
                            matchs.map((m) => {
                                return (
                                    <Stack key={m.betid}>
                                        <Typography variant="caption">{m.betid}</Typography>
                                        <Typography>{m.username}</Typography>
                                    </Stack>
                                )
                            })
                        }
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        )
    }
    //end-of-dialog
    function Question() {

        return (
            <Dialog open={quest} onClose={handleClosed}>
                <DialogTitle>Payment Strategy</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do You want to Refund the Money of those who lost the match?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Yes</Button>
                    <Button onClick={handleClose}>No</Button>
                </DialogActions>
            </Dialog>
        )
    }
    //form
    const form = useRef();
    function submitForm(event) {

        // Prevent the form from submitting.
        event.preventDefault();
        // Set url for submission and collect data.
        const formData = new FormData(event.target);
        // Build the data object.
        const data = {};

        formData.forEach((value, key) => (data[key] = value));
        // Log the data.
        let home = data.home;
        let away = data.away;
        console.log(data)
        setDrop(true)
        if (home > 3 || away > 3) {

            if (check) {
                VerifyN('Other', matchid)
                Verify('Other', matchid);
                setDrop(false)
                toast.success("bet uploaded")
            } else {
                Verify(home + " - " + away, matchid);
                setDrop(false)
                toast.success("bet uploaded")
            }

        } else {
            if (check) {
                Verify(home + " - " + away, matchid);
                VerifyN(home + " - " + away, matchid)
                setDrop(false)
                console.log(home + " - " + away)
                toast.success("bet uploaded")
            } else {
                // Verify(home + " - " + away, matchid)
                // console.log(home + " - " + away)
                Verify(home + " - " + away, matchid);
                setDrop(false)
                toast.success("Bet uploaded")
            }

            setDrop(false)
            toast.success("bet uploaded")
        }
    }
    //end form
    return (
        <Cover>
            <Stack sx={{ background: "inherit", width: "100%", height: "100%", marginTop: '100px' }} justifyContent="center" alignItems='center'>
                <DisplayDialog />
                <Toaster position="bottom-center" />
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={drop}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <Stack direction='row'>
                    <Link href='/admin/addBets'>
                        <motion.div style={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', padding: '8px', cursor: 'pointer' }} whileHover={{ scale: '1.02' }}>
                            <Stack direction='row'>
                                <AddIcon />
                                <Typography>Create New Matches</Typography></Stack>
                        </motion.div></Link>
                    <Link href={'/admin/select?id=1'}>
                        <motion.div style={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', padding: '8px', cursor: 'pointer' }} whileHover={{ scale: '1.02' }}>
                            <Stack direction='row'>
                                <AddIcon />
                                <Typography>Create New Matches - API </Typography></Stack>
                        </motion.div></Link>
                </Stack>

                <Typography variant="h6" color="#DDDDDD" sx={{ fontFamily: 'IBM Plex Sans Devanagari, sans-serif', fontSize: "35px" }}>All Bets</Typography>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Overpass, sans-serif' }} color="#DDDDDD">View and Have Access to Edit all Bets.</Typography>
                <Stack direction="column-reverse">
                    {
                        bets.map((b) => {
                            let stams = Date.parse(b.date + " " + b.time) / 1000;
                            let curren = new Date().getTime() / 1000;
                            if (stams > curren) {
                                return (
                                    <Stack key={b.match_id} direction="column" style={
                                        {
                                            "background": "#EEEEEE",
                                            "border": "1px solid rgba(255, 255, 255, 0.7)",
                                            "padding": "8px",
                                            'margin': "4px",
                                            minWidth: "345px"
                                        }
                                    }>
                                        <Typography variant="caption">Match Id : {b.match_id}</Typography>
                                        <Typography color="#061A40" sx={{ fontFamily: 'Solway, serif' }}>{b.home} vs {b.away}</Typography>
                                        <Box>
                                            <Typography sx={{ fontFamily: 'Rajdhani, sans-serif' }}>Match Details</Typography>
                                            <Typography sx={{ fontFamily: 'Spectral, serif' }}>League: {b.league}</Typography>
                                            <Typography sx={{ fontFamily: 'Spectral, serif' }}>Date: {b.date}</Typography>
                                            <Typography sx={{ fontFamily: 'Spectral, serif' }}>Time: {b.time}</Typography>
                                            <Typography sx={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'blue' }}>Status: Not Started</Typography>
                                            <Stack direction="row" justifyContent="space-around" alignItems="center">

                                                <Stack direction='column' justifyContent="center" alignItems="center" >
                                                    <PreviewIcon sx={{ width: "30px", height: "30px" }} />
                                                    <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View or Edit Odds</Typography>
                                                </Stack>

                                                <Stack direction='column' justifyContent="center" alignItems="center" onClick={() => {
                                                    setOpen(true)
                                                    setDisplay({
                                                        'match': b.match_id
                                                    })
                                                }}>
                                                    <PageviewIcon sx={{ width: "30px", height: "30px" }} />
                                                    <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View Bets Placed</Typography>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                )
                            } else {
                                //for finished matches
                                if (stams + 6600 < curren) {
                                    return (
                                        <Stack key={b.match_id} direction="column" style={
                                            {
                                                "background": "#EEEEEE",
                                                "border": "1px solid rgba(255, 255, 255, 0.7)",
                                                "padding": "8px",
                                                'margin': "4px",
                                                minWidth: "345px"
                                            }
                                        }>
                                            <form onSubmit={submitForm} ref={form}>
                                                <Typography variant="caption">Match Id : {b.match_id}</Typography>
                                                <Typography color="#061A40" sx={{ fontFamily: 'Solway, serif' }}>{b.home} vs {b.away}</Typography>
                                                <Box>
                                                    <Typography color="#061A40" sx={{ fontFamily: 'Rajdhani, sans-serif' }}>Match Details</Typography>
                                                    <Typography color="#061A40" sx={{ fontFamily: 'Spectral, serif' }}>League: {b.league}</Typography>
                                                    <Typography color="#061A40" sx={{ fontFamily: 'Spectral, serif' }}>Date: {b.date}</Typography>
                                                    <Typography color="#061A40" sx={{ fontFamily: 'Spectral, serif' }}>Time: {b.time}</Typography>
                                                    <Typography color="#061A40" sx={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'orange' }}>Status: Match Ended ... Please Input the Results below</Typography>
                                                    <Stack direction="column" spacing={3} justifyContent="center" alignItems="center">
                                                        <Box sx={{ padding: "8px" }}>
                                                            <TextField label="home" required name='home' sx={{ margin: "4px" }} variant="filled" type='number'
                                                            />
                                                            <TextField label="away" required name='away' sx={{ margin: "4px" }} variant="filled" type='number'
                                                            /></Box>
                                                        <Stack direction="row" justifyContent="center" alignItems="center">
                                                            <Checkbox value={check} onChange={(e) => {
                                                                setCheck(!check);
                                                            }} />
                                                            <Typography color="#061A40" sx={{}}>Is this a Company Game ?</Typography>
                                                        </Stack>
                                                        <TextField placeholder='companys market example: 0-0' sx={{ width: '100%', display: (check ? 'visible' : 'none') }} value={cGame} onChange={(e) => {
                                                            setCGame(e.target.value);
                                                        }} />
                                                        <Button variant="contained" type="submit" onClick={() => {
                                                            setDrop(true);
                                                            setMatchid(b.match_id);
                                                        }}>Verify</Button>
                                                    </Stack>
                                                    <Stack direction="row" justifyContent="space-around" alignItems="center">
                                                        <Link href={'/admin/matchdetail/' + b.match_id}>
                                                            <Stack direction='column' justifyContent="center" alignItems="center" >
                                                                <PreviewIcon sx={{ width: "30px", height: "30px" }} />
                                                                <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View or Edit Odds</Typography>
                                                            </Stack></Link>

                                                        <Stack direction='column' justifyContent="center" alignItems="center" onClick={() => {
                                                            setOpen(true)
                                                            setDisplay({
                                                                'match': b.match_id
                                                            })
                                                        }}>
                                                            <PageviewIcon sx={{ width: "30px", height: "30px" }} />
                                                            <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View Bets Placed</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </form>
                                        </Stack>
                                    )
                                } else {
                                    return (
                                        <Stack key={b.match_id} direction="column" style={
                                            {
                                                "background": "#EEEEEE",
                                                "border": "1px solid rgba(255, 255, 255, 0.7)",
                                                "padding": "8px",
                                                'margin': "4px",
                                                minWidth: "345px"
                                            }
                                        }>
                                            <Typography variant="caption">Match Id : {b.match_id}</Typography>
                                            <Typography color="#061A40" sx={{ fontFamily: 'Solway, serif' }}>{b.home} vs {b.away}</Typography>
                                            <Box>
                                                <Typography sx={{ fontFamily: 'Rajdhani, sans-serif' }}>Match Details</Typography>
                                                <Typography sx={{ fontFamily: 'Spectral, serif' }}>League: {b.league}</Typography>
                                                <Typography sx={{ fontFamily: 'Spectral, serif' }}>Date: {b.date}</Typography>
                                                <Typography sx={{ fontFamily: 'Spectral, serif' }}>Time: {b.time}</Typography>
                                                <Typography sx={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'blue' }}>Status: On Going</Typography>
                                                <Stack direction="row" justifyContent="space-around" alignItems="center">
                                                    <Link href={'/admin/matchdetail/' + b.match_id}>
                                                        <Stack direction='column' justifyContent="center" alignItems="center" >
                                                            <PreviewIcon sx={{ width: "30px", height: "30px" }} />
                                                            <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View or Edit Odds</Typography>
                                                        </Stack></Link>

                                                    <Stack direction='column' justifyContent="center" alignItems="center" onClick={() => {
                                                        setOpen(true)
                                                        setDisplay({
                                                            'match': b.match_id
                                                        })
                                                    }}>
                                                        <PageviewIcon sx={{ width: "30px", height: "30px" }} />
                                                        <Typography sx={{ fontFamily: 'Indie Flower, cursive' }}>View Bets Placed</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    )
                                }
                            }

                        })
                    }
                </Stack>
            </Stack>
        </Cover>
    )
}
export async function getServerSideProps(context) {
    const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('verified', false)
        .order('id', { ascending: true });
    let bets = data
    console.log(error)
    return {
        props: { bets }, // will be passed to the page component as props
    }
}
