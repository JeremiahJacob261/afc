import React from 'react'
import HomeBottom from '../bottomNav'
import { supabase } from '@/pages/api/supabase'
import Image from 'next/image'
import { Stack, TextField, Modal } from '@mui/material'
import { motion } from 'framer-motion'
import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router'
import { useEffect } from 'react';
import { useState } from 'react';
export default function Bet({datas}) {
    const router = useRouter();
    useEffect(() => {
        
    }, []);

    function BetRow() {
        return(
            <Stack direction='column' spacing={2} sx={{ marginBottom:'120px'}}>
            {
                datas.map((m) => {

                    return (
                        <motion.div
                            key={m.match_id}
                            onClick={() => {
                                router.push('/admin/matchdetail/' + m.match_id)
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Stack direction='column' spacing={1} sx={{ background: 'rgb(99, 1, 21)', padding: '10px', borderRadius: '8px',width:'310px' }} >
                                <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                                    <p>Match ID : {m.match_id}</p>
                                </Stack>
                                <p style={{ width:'100%',textAlign:"center",color:'grey'}}>{m.league}</p>
                                <Stack direction='row' spacing={1} justifyContent='space-between' alignItems='center'>
                                   
                                    <Stack direction='column' spacing={1} justifyContent='space-between' alignItems='center'>
                                        <Image src={m.ihome ?? "https://www.sfcsports01.com/ball.png"} width={50} height={50} />
                                         <p style={{ width:'80px',color:'whitesmoke',textAlign:'center'}}>{m.home}</p>
                                    </Stack>
                                    <p>VS</p>
                                    <Stack direction='column' spacing={1} justifyContent='space-between' alignItems='center'>
                                        <Image src={m.iaway ?? "https://www.sfcsports01.com/ball.png"} width={50} height={50} />
                                         <p style={{ width:'80px',color:'whitesmoke',textAlign:'center'}}>{m.away}</p>
                                    </Stack>
                                </Stack>
                                <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                                    <p>{m.time}</p><p>Date : {m.date}</p>
                                </Stack>
                                    <p>{m.company ? 'Company Game' : '.'}</p>
                            </Stack>
                        </motion.div>
                    )
                })
            }
        </Stack>

        )
    }
    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', minHeight: '100vh' }}>
            <h1>Bets</h1>
            <Stack direction="column" justifyContent='center'>
                <BetRow />
            </Stack>
            <Fab color="white" aria-label="add" sx={{ background:'white',position:'fixed',bottom:'15vh',right:'5vw'}}
             onClick={()=>{
                router.push('/admin/select?id=1')
            }}>
  <AddIcon sx={{color:'#ad1c39'}}
   onClick={()=>{
    router.push('/admin/select?id=1')
}}
  />
</Fab>
            <HomeBottom />
        </Stack>
    )
}
export async function getServerSideProps(context) {

    try {
        const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('verified', false)
        .order('id', { ascending: false });
        let datas = data;
        return {
            props: {
               datas:datas
            },
        }
    } catch (e) {
        console.log(e)
        let datas = [];
        return {
            props: {
               datas:datas
            },
        }
    }

}