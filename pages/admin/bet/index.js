import { Stack, TextField } from "@mui/material"
import { callAdminRpc } from '@/lib/adminRpcClient';
import { Button } from "@mui/material"
import { useState } from "react"
import { useRouter } from 'next/router'
import { motion } from "framer-motion"
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from "react"
import { Icon } from "@iconify/react"
import Modal from "@mui/material/Modal"
import Image from "next/image"
import { supabase } from "@/pages/api/supabase"
export default function Home({ notification }) {
    const router = useRouter();
    const id = router.query.id;
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    const rem = async (betd) => {

        const { error } = await supabase
            .from('placed')
            .delete()
            .eq('betid', betd);
    }
    const ChangeGcount = async (username) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ 'gcount': 0 })
            .eq('username', username)
    
            console.log(error)
        } catch (e) {
          console.log(e)
        }
      }
    const Depositing = async (damount, dusername) => {
        const { data, error } = await callAdminRpc('depositor', { amount: damount, names: dusername })
        console.log(error);
      }
    function DataShow() {
        const [opened, setOpened] = useState(false);
        const [address, setAddress] = useState("");
        
        if (notification && notification.length == 0) {
            return (
                <p>No Bet Data Available</p>
            )
        } else {
            const handleClick = (adds) => {
                setOpened(true);
                setAddress(adds);
            };

            const handleClosed = (event, reason) => {
                if (reason === 'clickaway') {
                    return;
                }

                setOpened(false);
            };
            return (
                <Stack direction="column" spacing={2} sx={{ minHeight: '100vh', marginBottom: '100px' }}>
                    {
                        notification.map((e) => {
                            function GetLeagues() {
                                const [league, setLeague] = useState({});

                                useEffect(() => {
                                    const getLeague = async (league) => {
                                        const { data, error } = await supabase
                                            .from('bets')
                                            .select('*')
                                            .eq('match_id', league);
                                        setLeague(data[0]);
                                    }
                                    getLeague(e.match_id);
                                })
                                return (
                                    <Stack direction='column' sx={{ width: '100%' }}>
                                        <Stack direction='row' justifyContent='space-between' alignItems="center" sx={{ width: '100%' }}>
                                            <Stack direction='row' justifyContent='center' alignItems="center" spacing={1}>
                                                
                                                <Image src={league.ihome ?? ''} width={20} height={20} alt='home_logo' />
                                                <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>{league.home}</p>
                                            </Stack>
                                            VS
                                            <Stack direction='row' justifyContent='center' alignItems="center" spacing={1}>
                                                <Image src={league.iaway ?? ''} width={20} height={20} alt='away_logo' />
                                                <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>{league.away}</p>

                                            </Stack>
                                        </Stack>
                                        <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>League: {league.league}</p>
                                        <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>Result: {league.results ?? 'not avaliable'}</p>
                                    </Stack>

                                )
                            }
                            let s = e;
                            let stams = Date.parse(s.date + " " + s.time) / 1000;
                            let curren = new Date().getTime() / 1000;
                            const Chan = async (bets, type) => {
                                const { data, error } = await callAdminRpc('chan', { bet: bets, des: type })
                                console.log(error);
                            }
                            return (
                                <Stack direction="column" justifyContent='center' alignItems='start' spacing={2} sx={{ background: '#420b16', width: '300px', padding: '8px', borderRadius: '8px' }} 
                                key={e.id}
                                >
                                    <Toaster
                                        position="bottom-center"
                                        reverseOrder={false}
                                        toastOptions={{
                                            style: {
                                                fontSize: '14px',
                                                background: '#ad1c39',
                                                color: '#fff',
                                            },
                                            iconTheme: {
                                                primary: 'white',
                                                secondary: 'rgba(194,127,8,1)',
                                            },
                                        }}
                                    />
                                    <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Bet Id:{e.betid}</p>
                                    <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Match Id:{e.match_id}</p>
                                    <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Market: {e.market}</p>
                                    <p style={{ fontSize: '13px', fontFamily: 'Poppins,sans-serif', fontWeight: '500', color: 'lavenderblush' }}>Username: {e.username}</p>
                                    <GetLeagues />
                                    <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}> Date: {e.date} {e.time}</p>
                                    <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>Stake: {e.stake} USDT</p>
                                    <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>Total: {parseFloat(e.stake) + parseFloat(e.aim)} USDT</p>
                                    <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>Odd: {e.odd}</p>
                                    <p style={{ fontSize: '15px', fontFamily: 'Poppins,sans-serif', fontWeight: '400' }}>Status: {(e.won === "true") ? 'Won' : (e.won === "false") ? 'Lost' : (stams + 5400 < curren) ? 'Processing' : (stams < curren) ? 'Ongoing' : 'Not Started'}</p>

                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.6 }}
                                        onClick={() => {
                                            let m = e;
                                            let cv = confirm("Do you want to delete this bet ?!\nEither yes(OK) or no(Cancel).");
                                            if (cv) {
                                                rem(m.betid);
                                                Depositing(m.stake, m.username);
                                                ChangeGcount(m.username);
                                                toast.success('Bet Deleted Successfully');
                                                router.push(`/admin/full/${id}`)
                                            }
                                        }}
                                        style={{ cursor: 'pointer', width: '100%', height: '40px', background: '#ad1c39', borderRadius: '8px', display: (stams < curren) ? 'none' : 'visible', justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <Stack sx={{ width:'100%',height:'100%'}} justifyContent="center" alignItems="center">
                                        <p>Cancel this Bet</p>
                                            </Stack>
                                    </motion.div>
                                </Stack>
                            )
                        })
                    }
                </Stack>
            )
        }
    }
    return (
        <div>
            <Icon icon="iconoir:cancel" color="gray" width="100" height="100" onClick={() => {
                router.push(`/admin/full/${id}`)
            }} />
            <h1 style={{ color: 'wheat' }}>Bets</h1>
            <DataShow />
        </div>
    )
}
export async function getServerSideProps(context) {
    let id = context.query.id;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('uid', id);
        let username = data[0].username;
        const { data: trans, error: transerror } = await supabase
            .from('placed')
            .select('*')
            .eq('username', username)
            .order('id', { ascending: false })

        if (transerror) {
            console.log(transerror);
        }
        return {
            props: {
                notification: trans
            },
        }
    } catch (e) {
        console.log(e)
        let trans = [];
        return {
            props: {
                notification: trans
            },
        }
    }
}
