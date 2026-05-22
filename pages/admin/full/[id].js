import { useRouter } from 'next/router'
import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import codes from '../api/codes.json';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { toast, Toaster } from "react-hot-toast";
import { Modal, TextField, Button } from '@mui/material';
import { Balance } from '@mui/icons-material';

export default function Home() {
    const [id, setId] = useState(null);
    const [datas, setDatas] = useState(null);
    const [referusers, setReferusers] = useState([]);
    const [bets, setBets] = useState([]);
    const [wonbet, setWonbet] = useState([]);
    const [lostbet, setLostbet] = useState([]);
    const [referredby, setReferredby] = useState(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const [opened, setOpened] = useState(false);
    const handleClosed = () => setOpened(false);
    const handleOpen = () => setOpened(true);
    const [balance, setBalance] = useState(datas?.balance);
    const [editbal, setEditbal] = useState(false);

    const deleteuserwallet = () => {
        try {
            async function deletewallet() {
                const { error } = await supabase
                    .from('wallets')
                    .delete()
                    .eq('username', datas?.username)
                if (error) {
                    console.log(error)
                    toast.success("an error occurred")
                } else {
                    toast.success("Wallet deleted successfully")
                }
            }

            deletewallet()
        } catch (e) {
            console.log(e)
        }
    }

    const updatebalance = () => {
        async function runner() {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .update({ 'balance': parseFloat(balance) })
                    .eq('username', datas?.username);
                toast.success("balance updated")
                console.log(error, balance, datas?.username);
                setEditbal(false);
            } catch (e) {
                console.log(e);
                toast.error("an error occurred")
            }
        }
        runner();
    }

    useEffect(() => {
        if (router.query?.id) {
            setId(router.query.id);
        }
    }, [router.query]);

    useEffect(() => {
        if (id) {
            async function run() {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('newrefer,username,email,uid,phone,countrycode,refer,lvla,lvlb,password,balance,totald')
                        .eq('uid', id);
                    const { data: refer, error: refererror } = await supabase
                        .from('users')
                        .select('*')
                        .or(`refer.eq.${data[0].newrefer},lvla.eq.${data[0].newrefer},lvlb.eq.${data[0].newrefer}`)
                    const { data: bets, error: betserror } = await supabase
                        .from('placed')
                        .select('*')
                        .eq('username', data[0].username)

                    let wonbet = bets.filter((value) => {
                        return value.won === 'true'
                    })
                    let lostbet = bets.filter((value) => {
                        return value.won === 'false'
                    })
                    let referusers = refer.length;
                    let datas = data[0];
                    const { data: referby, error: referbyerror } = await supabase
                        .from('users')
                        .select('username')
                        .eq('newrefer', datas['refer'])
                    console.log(referby)

                    setDatas(datas);
                    setReferusers(referusers);
                    setBets(bets);
                    setWonbet(wonbet);
                    setLostbet(lostbet);
                    setReferredby(referby[0] ? referby[0].username : "None");
                    setLoading(false);
                } catch (e) {
                    console.log(e)
                    setLoading(false);
                }
            }
            run();
        }
    }, [id]);

    function SwitchReferral() {
        const [news, setNews] = useState('');

        const switcher = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('refer,lvla')
                    .eq('newrefer', news)
                //chnage the refer of the new refer to the old refer
                const { data: oldrefer, error: oldrefererror } = await supabase
                    .from('users')
                    .update({ refer: news, lvla: data[0].refer ?? 0, lvlb: data[0].lvla ?? 0 })
                    .eq('newrefer', datas?.newrefer)
                if (oldrefererror) {
                    toast.error("Error Occured")
                } else {
                    toast.success("Switched Successfully")

                }
            } catch (e) {
                console.log(e)
                toast.error("Error Occured")
            }
        }

        return (
            <Modal
                open={opened}
                onClose={handleClosed}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Stack sx={{ width: '100%', height: '100%', background: 'black' }} justifyContent="center" alignItems="center" spacing={2}>
                    <Icon icon="iconoir:cancel" width={50} height={50} alt="withdraw" style={{ color: 'red' }}
                        onClick={() => {
                            setOpened(false)
                        }} />
                    <p>SWITCH REFERRAL for {datas?.username}</p>
                    <p>New Referral - Input the REFERRAL CODE of the New UPLINE</p>
                    <TextField sx={{ background: 'whitesmoke' }} id="outlined-basic" label="New Referral" variant="outlined" value={news} onChange={(e) => { setNews(e.target.value) }} />
                    <Button variant="contained" style={{ background: 'goldenrod', color: 'black' }} onClick={() => {
                        switcher();
                        setOpened(false)
                        window.location.reload();
                    }}>Switch</Button>
                </Stack>
            </Modal>
        )
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Stack direction='column' alignItems="center" justifyContent='center' sx={{ width: '100vw', minHeight: '100vh', marginBottom: '100px' }} spacing={2}>
            <SwitchReferral />
            <motion.div
                onClick={() => {
                    router.back();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.6 }}
            >
                <Icon icon="iconoir:cancel" color="gray" width="100" height="100" onClick={() => {
                    router.back();
                }} />
            </motion.div>

            <h1 style={{ color: 'rgba(208,134,4,1)' }}>{datas?.username}</h1>
            <Toaster position="bottom-center" />
            <Stack direction="row">
                <Stack direction="column" padding={3}>
                    <p>{datas?.email}</p>
                    <motion.p style={{ cursor: 'pointer', background: '#420B16', padding: '4px', borderRadius: '3px' }} whileTap={{ scale: 0.8, color: 'wheat' }} whileHover={{ scale: 1.01 }} onClick={() => {
                        navigator.clipboard.writeText(datas?.uid)
                        toast.success("Copied Successfully")
                    }}>{datas?.uid}</motion.p>
                    <p>Password: {datas?.password}</p>
                    <motion.p style={{ cursor: 'pointer', background: '#420B16', padding: '4px', borderRadius: '3px' }} whileTap={{ scale: 0.8, color: 'wheat' }} whileHover={{ scale: 1.01 }} onClick={() => {
                        navigator.clipboard.writeText(datas?.newrefer)
                        toast.success("Copied Successfully")
                    }}>Referral Id: {datas?.newrefer}</motion.p>
                    <Stack direction={"row"} justifyContent="start" alignItems={"center"} spacing={1} p={1}>
                        {(editbal) ? <>Balance:<input type="text" style={{ width: '70px', padding: '8px' }} placeholder='edit the balance' value={balance} onChange={(e) => {
                            setBalance(parseFloat(e.target.value));
                        }} />
                            <motion.p onClick={() => { updatebalance() }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.80 }} style={{ background: 'grey', width: '35px', color: 'black', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}>ok</motion.p> <br /></> : <p>Balance :{datas?.balance} USDT</p>}
                        <br />
                        <Icon icon="iconamoon:edit-light" width="24" height="24" style={{ color: '#DAA520' }} onClick={() => {
                            setEditbal(!editbal)
                        }} />
                    </Stack>
                    <p>Country: {codes.codes[datas?.countrycode]}</p>
                    <p>Phone: {datas?.countrycode}{datas?.phone}</p>

                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                        <p>Referred By: {datas?.refer} </p>
                        <p style={{ color: 'wheat' }}>{referredby}</p>
                        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.6 }} onClick={() => {
                            handleOpen()
                        }}>
                            <Icon icon="icon-park-outline:change" width="24" height="24" style={{ color: 'goldenrod' }} />
                        </motion.div>
                    </Stack>
                    <p>Referred Users: {referusers}</p>
                </Stack>

                <Stack direction="column">
                    <p>Bets Placed: {bets.length ?? 0}</p>
                    <p>Bets Won: {wonbet.length ?? 0}</p>
                    <p>Bets Lost: {lostbet.length ?? 0}</p>
                    <p>Total Deposits :$ {datas?.totald}</p>
                    <motion.div onClick={deleteuserwallet} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '100px', height: '45px', cursor: 'pointer' }}>
                        <p style={{ color: 'goldenrod', fontSize: '14px', fontWeight: '500' }}>delete wallet</p>
                    </motion.div>
                </Stack>
            </Stack>

            <Stack direction="column" spacing={2} sx={{ background: '#420b16', padding: '8px', borderRadius: '8px' }}>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/referral/${datas?.newrefer}`)
                    }}
                    className='refback' style={{ width: '310px', borderRadius: '12px', padding: '4px' }}>
                    <p>Referral</p>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/reward?id=${datas?.uid}`)
                    }} className='rewback' style={{ width: '310px', borderRadius: '12px', padding: '4px' }}>
                    <p>Reward</p>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/bet?id=${datas?.uid}`)
                    }} className='betback' style={{ width: '310px', borderRadius: '12px', padding: '4px' }}>
                    <p>Bets</p>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/security?id=${datas?.uid}`)
                    }} className='secback' style={{ width: '310px', borderRadius: '12px', padding: '4px' }}>
                    <p>Security</p>
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/transaction?id=${datas?.uid}`)
                    }} className='traback' style={{ width: '310px', borderRadius: '12px', padding: '6px' }}>

                    <Stack direction="column" sx={{ width: '100%', height: '100%' }} justifyContent={"center"} spacing={1} alignItems={"start"}>
                        <p>Transactions</p>
                        <p style={{ fontSize: '12px', fontWeight: '300' }}>view deposits, withdrawals and admin gifts</p>
                    </Stack>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => {
                        router.push(`/activities?id=${datas?.uid}`)
                    }} className='acback' style={{ width: '310px', borderRadius: '12px', padding: '6px' }}>
                    <Stack direction="column" sx={{ width: '100%', height: '100%' }} justifyContent={"center"} spacing={1} alignItems={"start"}>
                        <p>Activities</p>
                        <p style={{ fontSize: '12px', fontWeight: '300' }}>view user activities like, bets,e-wallet transaction,referrals, rebate and affliate bonuses</p>
                    </Stack>
                </motion.div>
            </Stack>
        </Stack>
    )
}