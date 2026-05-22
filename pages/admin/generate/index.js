import React, { useState } from 'react'
import HomeBottom from '../bottomNav'
import { Button, Stack, TextField } from '@mui/material'
import { Icon } from '@iconify/react'
import { supabase } from '@/pages/api/supabase'
import { useRouter } from 'next/router'
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export default function Generate() {
    const [code, setCode] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [admin, setAdmin] = React.useState('');
    const [open, setOpened] = useState(false);
    const handleClose = () => {
        setOpened(false)
    }
    const handleOpen = () => {
        setOpened(true)
    }
    const router = useRouter();

    const claim = async () => {
        handleOpen()
        if (username === '') {
            alert('please input a user name')
            handleClose()
        } else {
            if (admin === '') {
                alert('please input admin password')
                handleClose()
            } else {
                if (admin !== 'passwordadmin') {
                    alert('wrong admin password');
                    handleClose()
                    return;
                } else {
                    const checkname = async () => {
                        const { data, error } = await supabase
                            .from('users')
                            .select()
                            .eq('username', username)
                        if (data.length < 1) {
                            alert('User not found, please check the username again')
                            handleClose()
                        } else {
                            let codes = Math.random().toString().slice(2, 8);

                            setCode(codes);
                            try {
                                const { data, error } = await supabase
                                    .from('claim')
                                    .insert(
                                        { code: codes, username: username },
                                    );
                                handleClose()
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    }
                    checkname();
                }
            }
        }


    }
    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', height: '100vh' }}>

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Icon icon="fluent-mdl2:cancel" width={30} height={30} alt='cancel-ext' style={{ color: 'whitesmoke' }} onClick={() => {
                router.back()
            }} />
            <h1>Generate Claim Code</h1>
            <Stack direction='column' spacing={2} sx={{ height: '100vh', width: '100vw' }} alignItems='center'>
                <p
                    onClick={() => {
                        navigator.clipboard.writeText(code)
                        alert('copied')
                    }}
                >Code Generated for {username} : {code}</p>
                <TextField placeholder="input the username of the user" sx={{ background: 'whitesmoke', color: 'black' }} value={username} onChange={(event) => { setUsername(event.target.value) }} />
                <TextField placeholder='input admin password' sx={{ background: 'whitesmoke', color: 'black' }} value={admin} onChange={(event) => { setAdmin(event.target.value) }} />
                <Button onClick={claim} variant='contained' sx={{ background: 'black', color: 'white', padding: '8px', width: '310px' }}>Generate</Button>
            </Stack>
            <HomeBottom />
        </Stack>
    )
}