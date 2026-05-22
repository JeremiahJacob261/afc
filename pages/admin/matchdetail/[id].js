import { Stack } from '@mui/material';
import { callAdminRpc } from '@/lib/adminRpcClient';
import Image from 'next/image'
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { toast, Toaster } from "react-hot-toast";
import Checkbox from '@mui/material/Checkbox';
import { useRouter } from 'next/router'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { supabase } from '@/pages/api/supabase'
import { Modal } from '@mui/material';
// import { logics } from './logic';
export default function Home({ datas, mist }) {
    let s = datas;
    let m = datas;
    const router = useRouter();
    let matches = datas;
    const [drop, setDrop] = useState(false);

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

    function Placer({ txt, data, pick }) {
        const [open, setOpen] = useState(false);
        const handleClose = () => setOpen(false);
        const handleOpen = () => setOpen(true);
        const [odds, setOdds] = useState(data[pick]);
        const upDateOdd = async () => {
            try {
                if (odds === data[pick]) {
                    alert('No changes made');
                    handleClose();
                    return;
                } else {
                    if (odds === '') {
                        alert('Please enter a value');
                        return;
                    } else {
                        const { data, error } = await supabase
                            .from('bets')
                            .update({ [pick]: odds })
                            .eq('match_id', matches.match_id);
                        console.log(error, data)
                        router.push('/admin/matchdetail/' + matches.match_id)
                    }
                }
            } catch (e) {
                console.log(e)
                handleClose();
            }

        }

        return (
            <motion.div
                className='odds'
                onClick={handleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}>
                <Stack
                    direction='column' justifyContent='center' alignItems="center" style={{ display: 'flexbox' }}>

                    <p style={{ margin: 0, padding: 0, color: '#EA2B1F', fontSize: '12px', fontWeight: '200' }}>{markets[pick]}</p>
                    <p style={{ margin: 0, padding: 0, color: 'black', fontSize: '12px' }}>{data[pick]}</p>

                    <Icon icon='mi:edit' width={15} height={15} style={{ color: 'black' }} />
                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Stack sx={{ width: '100vw', height: '100vh' }} justifyContent='center' alignItems='center'>
                            <Stack direction='column' justifyContent='space-around' alignItems='center' sx={{ background: 'white', maxWidth: '310px', height: '310px', borderRadius: '12px', padding: '8px' }}>
                                <Button onClick={() => {
                                    router.push('/admin/matchdetail/' + matches.match_id)
                                    return;
                                }}>
                                    <Icon icon="fluent-mdl2:cancel" width={30} height={30} alt='cancel-ext' style={{ color: 'black', background: 'whitesmoke', padding: '8px', borderRadius: '5px' }} onClick={() => { router.push('/admin/matchdetail/' + matches.match_id) }} />
                                </Button>
                                <p style={{ color: 'black', fontWeight: '600', fontFamily: 'Poppins,sans-serif', fontSize: '18px' }}>Edit odds</p>
                                <TextField placeholder={data[pick]} value={odds} onChange={(e) => { setOdds(e.target.value) }} />
                                <Button onClick={upDateOdd} style={{ width: '100%', color: 'whitesmoke', background: 'black' }}>Update</Button>
                            </Stack>
                        </Stack>

                    </Modal>
                </Stack>
            </motion.div>
        )
    }

    function Analytics() {
        return (
            <Stack direction="column" spacing={2}>
                <Stack className='paisho' spacing={2}>
                    <p style={{ color: 'whitesmoke', margin: 0, padding: 0, fontSize: '17px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>Number Of Bet Placed :{mist.length}</p>
                    {
                        mist.map((m) => {
                            let date = new Date(m.created_at);
                            return (
                                <Stack direction='column' className='paisho-mini' key={m.id}>
                                    <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ width: '100%', height: '100%' }} >
                                        <p style={{ color: 'whitesmoke', margin: 0, padding: 0, fontSize: '17px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>{m.username}</p>
                                        <p style={{ color: 'whitesmoke', margin: 0, padding: 0, fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>{m.market}</p>
                                        <p style={{ color: 'whitesmoke', margin: 0, padding: 0, fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>{m.stake} USDT</p>
                                    </Stack>
                                    <p>{date.getHours() + ':' + date.getMinutes()}</p>
                                </Stack>
                            )
                        })
                    }
                </Stack>

            </Stack>
        )
    }

    function InputAfterMatchScore() {
        const [home, setHome] = useState("");
        const [away, setAway] = useState("");
        const [chome, setCHome] = useState("");
        const [caway, setCAway] = useState("");
        const [check, setCheck] = useState(matches.company);
        let stams = Date.parse(s.date + " " + s.time) / 1000;
        let curren = new Date().getTime() / 1000;
        return (
            <Stack direction='column' justifyContent='center' alignItems='center' sx={{ display: (stams > curren) ? 'none' : 'visible', width: '80%', height: '100%', background: '#420b16', padding: '8px', borderRadius: '8px' }}>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ width: '100%', height: '100%' }}>
                    <TextField placeholder={matches.home}
                        variant="outlined"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& > fieldset": {
                                        border: 'none'
                                    }
                                },
                                "& input": {
                                    color: 'white'
                                }
                            }
                        }}
                        sx={{
                            "& .MuiInputLabel-root": {
                                color: 'white'
                            },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                    border: 'none'
                                }
                            },
                            flex: 1,
                            letterSpacing: 2,
                            textAlign: 'center'
                        }}
                        type='number'
                        value={home}
                        onChange={(e) => { setHome(e.target.value) }}
                    />

                    <TextField placeholder={matches.away}
                        variant="outlined"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& > fieldset": {
                                        border: 'none'
                                    }
                                },
                                "& input": {
                                    color: 'white'
                                }
                            }
                        }}
                        sx={{
                            "& .MuiInputLabel-root": {
                                color: 'white'
                            },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                    border: 'none'
                                }
                            },
                            flex: 1,
                            letterSpacing: 2,
                            textAlign: 'center'
                        }}
                        type='number'
                        value={away}
                        onChange={(e) => { setAway(e.target.value) }}
                    />
                </Stack>
                <Stack direction='column' sx={{ display: matches.company ? 'visible' : 'none' }}>
                    <Stack direction='column' spacing={1}>
                        <p style={{ color: 'wheat', fontSize: '17px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>Company Game</p>
                        <p style={{ color: 'grey', fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>This match was set to be a company game. Please Input the companys desired result.</p>
                    </Stack>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ width: '100%', height: '100%' }}>
                        <TextField placeholder={"CO-" + matches.home}
                            variant="outlined"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    "& .MuiOutlinedInput-root": {
                                        "& > fieldset": {
                                            border: 'none'
                                        }
                                    },
                                    "& input": {
                                        color: 'white'
                                    }
                                }
                            }}
                            sx={{
                                "& .MuiInputLabel-root": {
                                    color: 'white'
                                },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        border: 'none'
                                    }
                                },
                                flex: 1,
                                letterSpacing: 2,
                                textAlign: 'center'
                            }}
                            type='number'
                            value={chome}
                            onChange={(e) => { setCHome(e.target.value) }}
                        />

                        <TextField placeholder={"CO-" + matches.away}
                            variant="outlined"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    "& .MuiOutlinedInput-root": {
                                        "& > fieldset": {
                                            border: 'none'
                                        }
                                    },
                                    "& input": {
                                        color: 'white'
                                    }
                                }
                            }}
                            sx={{
                                "& .MuiInputLabel-root": {
                                    color: 'white'
                                },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        border: 'none'
                                    }
                                },
                                flex: 1,
                                letterSpacing: 2,
                                textAlign: 'center'
                            }}
                            type='number'
                            value={caway}
                            onChange={(e) => { setCAway(e.target.value) }}
                        />
                    </Stack>
                </Stack>

                <Button sx={{ background: '#353535', width: '100%' }} onClick={async () => {
                    console.log(matches.match_id);
                    setDrop(true);
                    let searchValuex = {
                        home: home,
                        away: away,
                        chome: chome,
                        caway: caway,
                        check: check,
                        matchid: matches.match_id
                    };
                    try {
                        // scratch(home, away, chome, caway, check, matches.match_id);
                        const settle = async (reslut, id) => {
                            try {
                                const { error } = await supabase
                                    .from('bets')
                                    .update({ verified: true, results: reslut, live: false })
                                    .eq("match_id", id);  // match id
                            } catch (e) {
                                console.log(e);
                            }
                        }
                        settle(home + ' - ' + away, matches.match_id).then(() => {
                            toast.success('Match has been verified');
                        });
                        toast.success('SUCCESS');
                        setDrop(false);
                        router.push('/admin/match')
                        // const chek = async () => {
                        //     const { data, error } = await supabase
                        //         .from('placed')
                        //         .select('*')
                        //         .match({ 'match_id': matches.match_id, 'won': 'null' });
                        //     if (data.length > 0) {
                        //         return 'rerun';
                        //     } else {
                        //         return 'completed';
                        //     }
                        // }
                        // setTimeout(() => {
                        //     // Your code here
                        //     chek().then((res) => {
                        //         if (res === 'rerun') {
                        //             scratch(home, away, chome, caway, check, matches.match_id);
                        //             setDrop(false);
                        //             alert('Score has successfully been updated');
                        //             router.push('/admin/match')
                        //         } else {
                        //             setDrop(false);
                        //             alert('Score has successfully been updated');
                        //             router.push('/admin/match')
                        //         }
                        //     });
                        //     //check all the user has won the bet
                        // }, 10000);
                        //{ home: home, away: away, matchid: matches.match_id, check: matches.company, chome: chome, caway: caway }

                    } catch (error) {
                        console.log(error)
                        setDrop(false);
                    }
                }}>
                    <p style={{ color: 'whitesmoke', margin: 0, padding: 0, fontSize: '17px', fontFamily: 'Poppins,sans-serif', fontWeight: '500' }}>Submit</p>
                </Button>
            </Stack>
        )
    }
    function OddArrange() {
        return (
            <Stack direction='column' spacing={3} alignItems='center'>

                <Stack direction="column" className='homecol' spacing={2} justifyContent='center' alignItems='center'>
                    <p>Home</p>
                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.onenil} data={matches} pick='onenil' />
                        <Placer txt={matches.twonil} data={matches} pick={'twonil'} />
                        <Placer txt={matches.threenil} data={matches} pick={'threenil'} />
                    </Stack>
                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.twoone} data={matches} pick={'twoone'} />
                        <Placer txt={matches.threeone} data={matches} pick={'threeone'} />
                        <Placer txt={matches.threetwo} data={matches} pick={'threetwo'} />
                    </Stack>
                </Stack>

                <Stack direction="column" className='awaycol' spacing={2} justifyContent='center' alignItems='center'>
                    <p>Away</p>
                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.nilone} data={matches} pick={'nilone'} />
                        <Placer txt={matches.niltwo} data={matches} pick={'niltwo'} />
                        <Placer txt={matches.nilthree} data={matches} pick={'nilthree'} />
                    </Stack>

                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.onetwo} data={matches} pick={'onetwo'} />
                        <Placer txt={matches.onethree} data={matches} pick={'onethree'} />
                        <Placer txt={matches.twothree} data={matches} pick={'twothree'} />
                    </Stack>
                </Stack>

                <Stack direction="column" className='drawcol' spacing={2} justifyContent='center' alignItems='center'>
                    <p>Draw and Others</p>
                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.oneone} data={matches} pick={'oneone'} />
                        <Placer txt={matches.twotwo} data={matches} pick={'twotwo'} />
                        <Placer txt={matches.threethree} data={matches} pick={'threethree'} />
                    </Stack>
                    <Stack direction="row" sx={{ width: '100%', height: '100%' }} spacing={2} alignItems='center' justifyContent='center'>
                        <Placer txt={matches.otherscores} data={matches} pick={'otherscores'} />
                    </Stack>
                </Stack>
            </Stack>

        )
    }

    return (
        <Stack direction='column' alignItems="center" spacing={3} sx={{ width: '100vw', minHeight: '100vh', padding: '8px' }}>
            <Icon icon="fluent-mdl2:cancel" width={30} height={30} alt='cancel-ext' style={{ color: 'whitesmoke' }} onClick={() => {
                router.push('/admin/match');
            }} />
            <p>{datas.match_id}</p>
            <Toaster position="bottom-center" />

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={drop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '19px', fontWeight: '600' }}>{datas.league}</p>
            <Stack direction="row" justifyContent='space-around' sx={{ width: '100vw' }} alignItems="center">
                <Stack direction='column' spacing={1} justifyContent='space-between' alignItems='center'>
                    <Image src={m.ihome ?? "https://www.sfcsports01.com/ball.png"} width={50} height={50} />
                    <p style={{ width: '80px', color: 'whitesmoke' }}>{m.home}</p>
                </Stack>
                <p>VS</p>
                <Stack direction='column' spacing={1} justifyContent='space-between' alignItems='center'>
                    <Image src={m.iaway ?? "https://www.sfcsports01.com/ball.png"} width={50} height={50} />
                    <p style={{ width: '80px', color: 'whitesmoke' }}>{m.away}</p>
                </Stack>
            </Stack>
            <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                <p>{m.time}</p><p>Date : {m.date}</p>
            </Stack>
            {/* <button
                onClick={() => {
                    const getdat = async () => {
                        let sendingx = [
                            { user_id: 127, balance_change: 100 },
                            { user_id: 1266, balance_change: 1 },
                        ];
                        try {
                            let test = await fetch('http://localhost:5000/cv', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(sendingx)
                            }).then(data => {
                                return data.json();
                            })

                            console.log(test);
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    getdat();
                }}
            >server</button> */}
            <InputAfterMatchScore />
            <Stack direction='column' spacing={2} justifyContent='center' alignItems="center" sx={{ width: '100%' }}>
                <OddArrange />
                <Analytics />
            </Stack>

        </Stack>
    )
}
export async function getServerSideProps(context) {

    const id = context.params.id;
    try {
        console.log(id);
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id);
        const { data: match, error: err } = await supabase
            .from('placed')
            .select('*')
            .eq('match_id', id);
        return {
            props: {
                datas: data[0],
                mist: match
            },
        }
    } catch (e) {
        let data = {};
        let mist = [];
        return {
            props: {
                datas: data,
                mist: mist
            },
        }
    }


}
const scratch = async (home, away, chome, caway, check, matchid) => {

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

    //verify if the user has won the bet
    const Verify = async (reslut, id) => {
        console.log('Verifying...')

        try {
            //update data on the bets database
            const updater = async () => {
                const { error } = await supabase
                    .from('bets')
                    .update({ verified: true, results: reslut, live: false })
                    .eq("match_id", id);  // match id
                let market = reslut; // match score
                //get the lists of users who placed this particular bet
                const updateBalance = async (id, market) => {
                    const { data, error } = await supabase
                        .from('placed')
                        .select('*')
                        .match({
                            'match_id': id,
                            'won': 'null'
                        });
                    console.log(data);
                    for (let i = 0; i < data.length; i++) {
                        const d = data[i];
                        let matchScore = market;
                        try {
                            //check if the user placed a correct score or a double chance
                            if (d.market === "Home or Away" || d.market === "Draw or Away" || d.market === "Home or Draw") {
                                //match is a double chance
                                const [homex, awayx] = matchScore.split(" - ");
                                if (d.market === "Home or Away") {
                                    //check if the user placed a correct double chance
                                    if (awayx === homex) {
                                        //draw wins
                                        //rewards logic
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
                                        try {
                                            Bwon(d.aim + d.stake, d.username)
                                        } catch (e) {
                                            console.log(e);
                                        }

                                        //end of rewards logic
                                        //people wins
                                    } else {
                                        //home wins or draw
                                        Chan(d.betid, 'false');
                                        //people who lose
                                    }
                                } else if (d.market === "Draw or Away") {
                                    if (awayx < homex) {
                                        //home wins
                                        //rewards logic
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
                                        try {
                                            Bwon(d.aim + d.stake, d.username)
                                        } catch (e) {
                                            console.log(e);
                                        }

                                        //end of rewards logic
                                        //people wins
                                    } else {
                                        //away wins or draw
                                        Chan(d.betid, 'false');
                                        //people who lose
                                    }
                                } else {
                                    if (awayx > homex) {
                                        //draw
                                        //rewards logic
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
                                        try {
                                            Bwon(d.aim + d.stake, d.username)
                                        } catch (e) {
                                            console.log(e);
                                        }

                                        //end of rewards logic
                                        //people wins
                                    } else {
                                        //home wins or away
                                        Chan(d.betid, 'false');
                                        //people who lose
                                    }
                                }
                            } else {
                                //match is not a double chance

                                const [homex, awayx] = matchScore.split(" - ");
                                if (homex > 3 || awayx > 3) {
                                    //otherscores
                                    if (d.market === 'Other') {
                                        Chan(d.betid, 'false');
                                        //people who lost
                                    } else {
                                        //people who won the bet: reverse betting
                                        //rewards logic
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
                                        try {
                                            Bwon(d.aim + d.stake, d.username)
                                        } catch (e) {
                                            console.log(e);
                                        }

                                        //end of rewards logic
                                    }


                                } else {
                                    //normal
                                    if (d.market === market) {
                                        Chan(d.betid, 'false');
                                        //people who lost
                                    } else {
                                        //people who won the bet: reverse betting
                                        console.log((d.market === market) ? 'true' : 'false');
                                        //rewards logic
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
                                        try {
                                            Bwon(d.aim + d.stake, d.username)
                                        } catch (e) {
                                            console.log(e);
                                        }

                                        //end of rewards logic
                                    }
                                }
                            }
                            Bspend(d.stake, d.username)

                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
                updateBalance(id, market);
            };
            updater();
        } catch (e) {
            console.log(e);
        }

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
                        'won': 'null'
                    }
                )
            data.map((d) => {
                console.log(d);
                if (d.market == market) {

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

    //verify if the company lost the bet
    const VerifyNL = async (reslut, id) => {
        console.log('Verifying...')
        const { error } = await supabase
            .from('bets')
            .update({
                'verified': true,
                'results': reslut
            })
            .match({
                'match_id': id
            });
        console.log(error);
        let market = reslut;
        const updateBalance = async (id, market) => {
            const { data, error } = await supabase
                .from('placed')
                .select('*')
                .match({
                    'match_id': id,
                    'won': 'null'
                });

            console.log(data);
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                try {
                    if (d.market != market) {
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
                        const inBal = async () => {
                            const { data, error } = await callAdminRpc('depositor', { amount: parseFloat(d.stake), names: d.username })
                            console.log(error)
                        }
                        inBal()
                        Chan(d.betid, 'false');
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }
        updateBalance(id, market);


    }
    //reverse betting
    //check if the match is a company match
    if (check) {
        //yes, it's a company game
        if (home == chome && away == caway) {
            //check if the score is equal to the company score : that means company lost
            //yes, it's equal
            if (chome > 3 || caway > 3) {
                //check if the score is greater than 3
                //yes, it's greater than 3
                VerifyNL('Other', matchid);
                toast.success('Match has been verified');
            } else {
                VerifyNL(home + ' - ' + away, matchid);
                toast.success('Match has been verified');
            }
        } else {
            //no, it's not equal : that means company won
            if (home > 3 || away > 3) {
                //check if the score is greater than 3
                //yes, it's greater than 3
                Verify('Other', matchid);
                toast.success('Match has been verified');
            } else {
                Verify(home + ' - ' + away, matchid);
                toast.success('Match has been verified');
            }
        }
    } else {
        // no, it's not a company game
        if (home > 3 || away > 3) {
            //check if the score is greater than 3
            //yes, it's greater than 3
            Verify('Other', matchid);
            toast.success('Match has been verified');
        } else {
            Verify(home + ' - ' + away, matchid);
            toast.success('Match has been verified');
        }
    }
}