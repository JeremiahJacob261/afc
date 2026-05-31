import React from "react";
import { callAdminRpc } from '@/lib/adminRpcClient';
import Image from "next/image";

import Logo from '@/public/favicon.ico'
import { supabase } from '@/pages/api/supabase'
import { motion } from "framer-motion";
import { Stack, Box, Typography, Divider, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link'
import Head from 'next/head'
export default function Cover({ children }) {
    const wih = async (damount, dusername) => {
        const { data, error } = await callAdminRpc('withdrawer', { amount: damount, names: dusername });
        console.log(error)
    }
    const rem = async (betd) => {

        const { error } = await supabase
            .from('placed')
            .delete()
            .eq('betid', betd);
    }
    const Depositing = async (damount, dusername) => {
        const { data, error } = await callAdminRpc('depositor', { amount: damount, names: dusername })
        console.log(error);
    }
    async function deduct() {
        const { data, error } = await supabase
            .from('placed')
            .select('*')
            .eq('match_id', '1057162')
        const userinf = data;
        userinf.map((m) => {
            async function delbet(m) {
                const { data, error } = await supabase
                    .from('placed')
                    .select('*')
                    .match({
                        'username': m.username,
                        'won': null
                    })
                data.map((m) => {
                    rem(m.betid);
                    Depositing(m.stake, m.username);
                })
            }
            delbet(m);
            async function update(m) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', m.username);
                const userbal = data[0].balance;
                console.log(m.username)
                let mer = parseFloat(m.stake) * 1.5;
                let mar = parseFloat(m.stake + m.aim);
                if (userbal >= mer) {
                    wih(mar, m.username);
                } else {
                    console.log(userbal)
                    console.log(mer)
                }
                console.log(error)
            }
            setInterval(() => {
                console.log('started')
                update(m);
            }, 500);
        })

    }
    return (
        <Stack direction="column"
            justifyContent="flex-start"
            alignItems="center"
        >
            <Head>
                <title>DashBoard</title>
                <link rel="icon" href="/logo_afc.ico" />
            </Head>
            <Stack className="dash" direction="row" alignItems='center'
                spacing={7}
                style={{ maxHeight: "100px", background: 'rgb(44, 2, 10)', width: "100vw", padding: "12px", position: 'fixed' }}>

                <Stack direction='row' justifyContent='center' alignItems='center' spacing={3} >
                    <Image src={Logo} width='50' height='60' />
                    <Typography style={{ color: 'whitesmoke', fontFamily: "Source Sans Pro,sans-serif" }}>SFCSPORTS</Typography>
                </Stack>
                <Stack direction='row' spacing={4}>
                    <motion.div whileHover={{ backgroundColor: '#AC915FD2', borderRadius: "27px", color: '#C61F41', scale: '1.05' }} style={{ padding: "6px 18px 6px 18px" }}>
                        <Link href='/admin/dashboardslist'> <Typography sx={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif", cursor: 'pointer' }}>Users</Typography></Link>
                    </motion.div>
                    <motion.div whileHover={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', scale: '1.05' }} style={{ padding: "6px 18px 6px 18px" }}>
                        <Link href='/admin/finance'><Typography sx={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif", cursor: 'pointer' }}>Finances</Typography>
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', scale: '1.05' }} style={{ padding: "6px 18px 6px 18px" }}>
                        <Link href='/admin/bets'> <Typography sx={{ color: 'white', fontFamily: "Source Sans Pro,sans-serif", cursor: 'pointer' }}>Matches</Typography>
                        </Link>
                    </motion.div>
                    <Link href='/admin/announcement'>
                        <motion.div whileHover={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', scale: '1.05' }} style={{ padding: "6px 18px 6px 18px" }}>
                            <Typography sx={{ color: 'white', cursor: 'pointer' }}>Announcement</Typography>
                        </motion.div></Link>
                    <Link href='/admin/claim'>
                        <motion.div whileHover={{ backgroundColor: '#AC915FD2', borderRadius: "20px", color: '#C61F41', scale: '1.05' }} style={{ padding: "6px 18px 6px 18px" }}>
                            <Typography sx={{ color: 'white', cursor: 'pointer' }}>Generate Code</Typography>
                        </motion.div></Link>
                </Stack>
                <motion.div whileHover={{ backgroundColor: '#C61F41', borderRadius: "8px" }} style={{ padding: '8px' }}>
                    <SearchIcon sx={{ color: "#AC915FD2" }} />
                </motion.div>
                <motion.div whileHover={{ backgroundColor: '#C61F41', borderRadius: "8px" }} style={{ padding: '8px' }}>
                    <LogoutIcon sx={{ color: "#AC915FD2" }} />
                </motion.div>
            </Stack>
            <Divider orientation='vertical' sx={{ background: '#AC915FD2' }} />
            <Box className='content'>
                {children}
            </Box>
        </Stack>
    )
}
