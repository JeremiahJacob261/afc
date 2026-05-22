import { Stack,TextField } from '@mui/material'
import  '@/styles/globals.css';
import { useRouter } from 'next/router'
import { useState } from 'react'
import { motion } from 'framer-motion'
export default function Home(){
    const router = useRouter();
    const [username,setUsername]=useState('')
    const [password,setPassword]=useState('')
    const login =()=>{ 
        if(username==='admin' && password==='nopassword'){
            alert('login successful')
            
            router.push('/admin/home')
        }
        else{
            alert('login failed')
        }
    }
    return(
        <div>
            <Stack direction='column' justifyContent='center' aligntems="center" spacing={1} sx={{ width:'100%',height:'100vh'}}>
        <Stack direction='column' justifyContent='center' aligntems="center" sx={{ width:'100%'}}>
            
        </Stack>
        <p style={{ textAlign:'center',width:'100%'}}>Welcome to SFCSPORTS01</p>
        <TextField placeholder='username' sx={{ background:'whitesmoke',color:'black' }} 
        value={username} onChange={(e)=>{
            setUsername(e.target.value)
        }}/>

        <TextField placeholder='password' sx={{ background:'whitesmoke',color:'black' }} 
        value={password} onChange={(e)=>{
            setPassword(e.target.value)
        }}/>
        <motion.div
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }} 
        className='login' onClick={login}><p>Login</p></motion.div>
            </Stack>
        </div>
    )
}