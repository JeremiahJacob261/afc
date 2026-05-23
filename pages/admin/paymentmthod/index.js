import React, { useState } from 'react'
import { Button, Stack, TextField } from '@mui/material'
import { Icon } from '@iconify/react'
import { toast, Toaster } from "react-hot-toast";
import { motion } from 'framer-motion'
import { supabase } from '@/pages/api/supabase'
import { useRouter } from 'next/router'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export default function Generate() {
    const [code, setCode] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [name, setName] = useState('');
    const [number, setNumber] = useState('')
    const [method, setMethod] = useState("kpay1");
    const [open, setOpened] = useState(false);
    const handleClose = () => {
        setOpened(false)
    }
    const handleOpen = () => {
        setOpened(true)
    }
    const router = useRouter();


    const setaccount = async () => {
        try {
            const { error } = await supabase
                .from('depositwallet')
                .update({ 'address': number, 'accountname': name })
                .eq('name', method);
            if (error) {
                toast.error('an error occured')
            } else {
                toast.success('wallet set successfully')
            }
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', height: '100vh' }}>
            <Toaster position="bottom-center" />
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Icon icon="fluent-mdl2:cancel" width={30} height={30} alt='cancel-ext' style={{ color: 'whitesmoke' }} onClick={() => {
                router.back()
            }} />
            <h1>EDIT Payment METHOD</h1>
            <Stack direction='column' spacing={2} sx={{ height: '100vh', width: '100vw' }} alignItems='center'>
                <p style={{ color: 'whitesmoke', }}>set new company deposit account</p>
                <select style={{ width: '250px', height: '50px' }} value={method} onChange={(e) => { setMethod(e.target.value) }}>
                    <option>kpay1</option>
                    <option>kpay2</option>
                    <option>wave1</option>
                    <option>wave2</option>
                </select>

                <input type="text" className='tex' placeholder='number' value={number} onChange={(e)=>{ setNumber(e.target.value)}}/>
                <input type="text" className='tex' placeholder='name' value={name} onChange={(e)=>{ setName(e.target.value)}}/>
                <motion.div onClick={setaccount} whileTap={{ scale: 0.9 }} className='newbtn'>
                    <p>set new account details</p>
                </motion.div>
            </Stack>
        </Stack>
    )
}
