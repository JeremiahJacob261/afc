import { Stack, Box } from "@mui/material";
import React, { use } from "react";
import Logo from '@/public/favicon.ico'
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Image from "next/image";
import HomeBottom from "../bottomNav";
import { useState } from "react";
import { supabase } from '@/pages/api/supabase'
export default function Home({test}) {
    const router = useRouter();
    const [userData, setUserData] = useState([1, 2, 6, 2, 6, 9, 4, 10, 12, 4]);
    const [financesData, setFinancesData] = useState([1, 2, 6, 2, 6, 9, 4, 10, 12, 4]);
    const [betData, setBetData] = useState([1, 2, 6, 2, 6, 9, 4, 10, 12, 4]);

    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', marginBottom: '110px', minHeight: '100vh' }}>
            <Stack direction='row' sx={{ width: '100vw', padding: '8px', background: 'transparent', opacity: '0.7', color: 'white' }} justifyContent='space-between' alignItems='center'>
                <Stack direction='column' justifyContent='center' alignItems='center' sx={{ height: '80px' }}>
                    <p>DASHBOARD</p>
                </Stack>
                <Image src={Logo} width={60} height={60} alt='logo' />
            </Stack>
            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" sx={{ width:'100vw',padding:'8px'}}>
                <Stack className="chart1" direction='column' justifyContent='center' alignItems="center">
     <p>Number of Users</p>
     <p>{test.user}</p>
                </Stack>
                <Stack className="chart2" direction='column' justifyContent='center' alignItems="center">
                <p>Number of Bet Placed Today</p>
     <p>{test.bet}</p>
                </Stack>
                <Stack className="chart3" direction='column' justifyContent='center' alignItems="center">
                <p>Total Deposits by Users</p>
     <p>{test.depo ?? 0} USDT</p>
                </Stack>
                <Stack className="chart4" direction='column' justifyContent='center' alignItems="center">
                <p>Total Withdrawal by Users(Amount)</p>
     <p>{test.with} USDT</p>
                </Stack>
            </Stack>
                
            <HomeBottom />
        </Stack>
    )
}
export async function getServerSideProps(context) { 
    try {
        let test = await fetch('https://admin.dfco1.com/api/analytics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(data => {
            return data.json();
        })
        return{props:{ test},}
    } catch (e) {
        console.log(e);
        let test = {};
        return{props:{ test },}
    }
}