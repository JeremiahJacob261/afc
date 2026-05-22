import React from 'react'
import { supabase } from './api/supabase'
import { Button, Stack, TextField } from '@mui/material'
export default function Claim() {
    const [code, setCode] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [admin, setAdmin] = React.useState('');
   const claim = async () => { 
    if(admin !== 'passwordadmin'){
        alert('wrong admin');
        return;
    }else{
         let codes =  Math.random().toString().slice(2, 8);
    const { data, error } = await supabase
    .from('claim')
    .insert(
      { code: codes, username: username},
    );
    setCode(codes);
    }
  
    }
    return (
        <Stack sx={{ width:'100vw',height:'100vh'}} justifyContent="center" alignItems="center" spacing={3}>
            <h1>Generate Bonus Claim Code For User</h1>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} style={{ color:'whitesmoke',background:'greenyellow',padding:'8px',borderRadius:'8px'}}  
          >
            <p   onClick={()=>{
                navigator.clipboard.writeText(code)
                alert('copied')
            }}
            >Generated Code for {username} : {code}</p>
            <p style={{ fontSize:'10px',fontWeight:'200',color:'grey'}}>click to copy</p>
                </Stack>
            <TextField placeholder="input the username of the user" sx={{ background:'whitesmoke',color:'black'}} value={username} onChange={(event)=>{ setUsername(event.target.value)}}/>
            <TextField placeholder='input admin' sx={{ background:'whitesmoke',color:'black'}} value={admin} onChange={(event)=>{ setAdmin(event.target.value)}}/>
            <Button onClick={()=>{claim()}}>Generate Code</Button>
        </Stack>
    )
}