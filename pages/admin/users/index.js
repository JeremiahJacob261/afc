import React, { useState } from 'react'
import HomeBottom from '../bottomNav'
import { supabase } from '../api/supabase'
import { Fab } from '@mui/material';
import Image from 'next/image'
import { Stack, TextField, Modal } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useEffect } from 'react';
export default function Users({ dount, count, datw }) {
    const [opened, setOpened] = useState(false);
    const router = useRouter();
    const [searchValue, setSearchValue] = React.useState('');

    const [data, setData] = React.useState(datw);
    const search = async () => {
        try {
            let test = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ find: searchValue })
            }).then(data => {
                return data.json();
            })
            setData(test);
        } catch (e) {
            console.log(e)
        }

    }
    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', minHeight: '100vh', marginBottom: '120px' }}>

            <Stack direction='column' spacing={2} sx={{ width: '100vw', minHeight: '75vh' }} justifyContent='center' alignItems='center'>

                <Stack sx={{ width: '100vw', background: 'rgb(99, 1, 21)', position: 'relative', top: '0px' }} justifyContent='center' alignItems='center'>
                    <h1 style={{ color: 'whitesmoke' }}>Users</h1>
                    <Stack direction='row' spacing={1} justifyContent='center' alignItems='center' sx={{ width: '100vw', padding: '8px' }}>
                        <TextField id="standard-basic" label="search by username or referral code" variant="standard"
                            inputProps={{ style: { color: "white" } }}
                            value={searchValue}
                            onChange={(e) => { setSearchValue(e.target.value); }}
                            sx={{ background: 'rgb(99, 1, 21)', paddding: '8px', color: 'white', borderRadius: '8px', letterSpacing: 2, flex: 1 }} />
                        <Icon icon="iconoir:search" color="gray" width="24" height="24" onClick={search} />
                        <Icon icon="mdi:cancel-bold" color="#FCBA04" width="24" height="24" onClick={() => {
                            setData(datw)
                            setSearchValue('');
                        }} />
                    </Stack>
                </Stack>
                <Stack direction='row' sx={{ background: 'rgb(99, 1, 21)', padding: '10px', borderRadius: '8px', width: '90vw', maxWidth: '350px' }} spacing={1} >
                    <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                        <p>Total Users : {count}</p>
                    </Stack>
                    <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                        <p>Active Users : {dount}</p>
                    </Stack>
                </Stack>
                <Stack direction='column' spacing={1} >
                    {
                        data.map((m) => {
                            const handleOpened = () => setOpened(true);
                            const handleClosed = () => setOpened(false);
                            let date = new Date(m.crdate);
                            let day = date.getDate();
                            let month = date.getMonth() + 1;
                            let year = date.getFullYear();
                            let hours = date.getHours();
                            let minutes = date.getMinutes();
                            let fullDay = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
                            return (
                                <motion.div
                                    key={m.uid}
                                    onClick={() => {
                                        router.push(`/full/${m.uid}`)
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.6 }}
                                    style={{ padding: '2px', width: '200px', background: 'grey', borderRadius: '8px', width: '90vw', maxWidth: '350px' }}>
                                    <Stack direction='row' alignItems='center' spacing={2} sx={{ height: '85px' }}>
                                        <Stack direction='column' justifyContent='center' alignItems='start' sx={{ flex: 1 }}>
                                            <p style={{ color: '#FABC2A', padding: '3px', margin: '4px', fontFamily: 'Poppins,sans-serif' }}>{m.username}</p>
                                            <p style={{ color: 'whitesmoke', fontSize: '13px', padding: '3px', margin: '2px', fontFamily: 'Poppins,sans-serif' }}>{m.uid}</p>
                                            <p style={{ color: 'whitesmoke', fontSize: '13px', padding: '3px', margin: '2px', fontFamily: 'Poppins,sans-serif' }}>{fullDay}</p>
                                        </Stack>
                                    </Stack>
                                </motion.div>
                            )
                        })
                    }
                </Stack>
            </Stack>
            <Fab color="white" aria-label="add" sx={{ background: 'white', position: 'fixed', bottom: '15vh', right: '5vw' }}
                onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                }}>
                <KeyboardArrowUpIcon sx={{ color: '#ad1c39' }} />
            </Fab>
            <HomeBottom />
        </Stack>
    )
}
export async function getServerSideProps(context) {

    try {
        const { data: depe, count: dount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('firstd', true)
        const { data, count } = await supabase
            .from('users')
            .select('crdate,uid,profile,username', { count: 'exact' })
            .order('keyf', { ascending: false })
        // console.log(dount, count, data)
        return {
            props: {
                dount: dount,
                count: count,
                datw: data
            },
        }
    } catch (e) {
        console.log(e)

    }

}