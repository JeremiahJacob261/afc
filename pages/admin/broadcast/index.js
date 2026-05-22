import { TextField } from "@mui/material";
import { Button, Stack } from "@mui/material";
import { supabase } from '../api/supabase'
import { useState } from 'react';
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react';
import { useRouter } from "next/router";
export default function Broadcast() {
    const router = useRouter();
    const [msg, setMsg] = useState('');
    //send message to all users -start
    async function sendMsg() {
        const { error } = await supabase
            .from('activa')
            .insert({
                'code': 'broadcast',
                'username': msg
            });
        console.log(error);
        alert('Announcement Sent!!!');
        setMsg('');
    }
    //end -sending message
    return (
        <Stack direction="column" alignItems='center' justifyContent="center" spacing={2} sx={{ width: '320px', height: '100vh' }}>
            <motion.div
                whileHover={{ color: 'red' }}
                whileTap={{ color: 'green' }}
            >
                <Icon icon="fluent-mdl2:cancel" width={30} height={30} alt='cancel-ext' style={{ color: 'whitesmoke' }} onClick={() => {
                    router.push('/admin/control')
                }} />
            </motion.div>

            <h2>BroadCast</h2>
            <TextField placeholder="anouncements" sx={{ width: '310px', color: 'black', background: 'whitesmoke' }} value={msg} onChange={(e) => {
                setMsg(e.target.value);
                console.log('Done');
            }} />
            <Button variant='contained' sx={{ background: 'grey', color: 'black', width: '310px' }} onClick={sendMsg}>
                Send
            </Button>
        </Stack>
    )
}