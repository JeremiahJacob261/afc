import { Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import Cover from './cover'
export default function Transaction() {
    const [trans,setTrans] = useState([])
    useEffect(()=>{
        const getTran=async()=>{
             const { data, error } = await supabase
        .from('useractivity')
        .select()
        .eq('user',localStorage.getItem('me'))
    setTrans(data)
        }
       getTran()
    },[])
    return(
        <Cover>
        <Stack direction="column-reverse">
{
    trans.map((t)=>{
       if(t.type === 'bets'){
        return(
            <Stack key={t.uid}>
                <Typography>
                    You placed a bet 
                </Typography>
                <Divider/>
                </Stack>
        )
       }else{
        if(t.type === 'deposit'){

            return(
                <Stack key={t.uid}>
                    <Typography>
                        Your deposit claim of {t.amount} USDT  was verified.
                    </Typography>
                    <Divider/>
                    </Stack>
            )
        }else{
            return(
                <Stack key={t.uid}>
                    <Typography>
                        Your WithDrawal of {t.amount} was confirmed.
                    </Typography>
                    <Divider/>
                    </Stack>
            )
        }
       }
    })
}
        </Stack>
        </Cover>
    )
}
