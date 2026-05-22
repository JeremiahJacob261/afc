import React, { useState } from 'react'
import {Typography,TextField,Button,Stack} from '@mui/material'
import {supabase} from './api/supabase'
import Cover from './cover'
export default function Announcement(){
    const [msg,setMsg] = useState('');
    //send message to all users -start
    async function sendMsg(){
        const {error} = await supabase
        .from('activa')
        .insert({
            'code':'broadcast',
            'username':msg
        });
        console.log(error);
        alert('Announcement Sent!!!');
        setMsg('');
    }
    //end -sending message
    return(
        <Cover>
        <Stack direction="column" spacing={3} sx={{minWidth:'360px',marginTop:'100px'}}>
            <Typography variant="h4" sx={{color:'#FFD700',fontFamily:'Poppins,sans-serif',width:'100%'}}>Announcement</Typography>
            <TextField sx={{color:'black',background:'white'}} label='type in your Announcement' value={msg} onChange={(e)=>{
                setMsg(e.target.value);
    console.log('Done');
            }}/>
            <Button variant='contained' sx={{background:'#FFD700'}} onClick={sendMsg}>Send Message</Button>
            </Stack>
            </Cover>
    )
}
