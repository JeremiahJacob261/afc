import { Stack } from '@mui/material';
import { supabase } from '../api/supabase';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router'
import { useEffect } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
export default function Home({ referd, lvlad, lvlbd,getup1,refid }) {
    const router = useRouter();
    let colors = ['#009B72', '#800E13', '#264653'];
    return (
        <div>

            <Stack direction='column' alignItems="center" justifyContent='start' sx={{ width: '100vw', minHeight: '100vh' }} spacing={2}>
                <motion.div
                    onClick={() => {
                        router.back()
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.6 }}
                >
                    <Icon icon="iconoir:cancel" color="gray" width="100" height="100" onClick={() => {
                        router.back()
                    }} />
                </motion.div>
                <h1 style={{ color:'whitesmoke' }}>Referral</h1>
                <h3 style={{ color:'whitesmoke' }}>Uplines</h3>
                <Stack direction='column' alignItems="center" spacing={3} justifyContent='space-around' sx={{ width: '100vw', padding: '8px' }}>
                {
                    getup1.map((m,index) => {
                        let date = new Date(m.crdate);
                        let day = date.getDate();
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        let fullDate = day + '/' + month + '/' + year;
                        return (
                            <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.6 }}
                            key={m.uid}
                            onClick={() => {
                                router.push(`/full/${m.uid}`)
                            }}
                        >
                            <p>{(m.newrefer === refid.refer) ? 'Direct Upline' : (m.newrefer === refid.lvla) ? 'Second Upline' : 'Third Upline'}</p>
                            <Stack
                                spacing={2}
                                direction='row' alignItems="center" justifyContent='start'
                                sx={{ width: '280px', padding: '6px', borderRadius: '8px', background: colors[index] }}
                                onClick={() => {
                                    router.push(`/full/${m.uid}`)
                                }}>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', margin: 0, fontFamily: 'Poppins,sans-serif' }}>{m.username}</p>
                                    <p style={{ color: 'whitesmoke', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.uid}</p>
                                    <p style={{ color: 'whitesmoke', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.firstd ? 'active' : 'not active'}</p>
                               </Stack>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{m.balance} USDT</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{fullDate}</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>Referral: {m.newrefer}</p>
                                </Stack>
                            </Stack>
                        </motion.div>
                        )
                    })
                }

                </Stack>
                <Stack direction='row' alignItems="center" justifyContent='space-around' sx={{ width: '100vw', padding: '8px' }}>
                    <p className='count'>Level 1: {referd.length}</p>
                    <p className='count'>Level 2: {lvlad.length}</p>
                    <p className='count'>Level 3: {lvlbd.length}</p>
                </Stack>
                <Stack direction='row' alignItems="center" justifyContent='start' sx={{ width: '100vw', padding: '8px' }}>
                    <p style={{ fontSize: '17px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#F9DC5C' }}>Level 1</p>
                </Stack>
                {
                    referd.map((m) => {
                        let date = new Date(m.crdate);
                        let day = date.getDate();
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        let fullDate = day + '/' + month + '/' + year;
                        return (
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.6 }}
                                key={m.uid}
                                onClick={() => {
                                    router.push(`/full/${m.uid}`)
                                }}
                            >
                                <Stack
                                    spacing={2}
                                    direction='row' alignItems="center" justifyContent='start'
                                    sx={{ width: '310px', padding: '6px', borderRadius: '8px', background: '#F56960' }}
                                    onClick={() => {
                                        router.push(`/full/${m.uid}`)
                                    }}>
                                    <Stack>
                                        <p style={{ color: '#F2EDEB', margin: 0, fontFamily: 'Poppins,sans-serif' }}>{m.username}</p>
                                        <p style={{ color: 'whitesmoke', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.uid}</p>
                                        <p style={{ color: m.firstd ? 'black' : 'white', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.firstd ? 'active' : 'not active'}</p>
                               </Stack>
                                    <Stack>
                                        <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{m.balance} USDT</p>
                                        <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{fullDate}</p>
                                        <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>Referral: {m.newrefer}</p>
                                    </Stack>
                                </Stack>
                            </motion.div>
                        )
                    })
                }
                <Stack direction='row' alignItems="center" justifyContent='start' sx={{ width: '100vw', padding: '8px' }}>
                    <p style={{ fontSize: '17px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9CE2C' }}>Level 2</p>
                </Stack>

                {
                    lvlad.map((m) => {
                        let date = new Date(m.crdate);
                        let day = date.getDate();
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        let fullDate = day + '/' + month + '/' + year;
                        return (
                            <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.6 }}
                            key={m.uid}
                            onClick={() => {
                                router.push(`/full/${m.uid}`)
                            }}
                        >
                            <Stack
                                spacing={2}
                                direction='row' alignItems="center" justifyContent='start'
                                sx={{ width: '310px', padding: '6px', borderRadius: '8px', background: '#F56960' }}
                                onClick={() => {
                                    router.push(`/full/${m.uid}`)
                                }}>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', margin: 0, fontFamily: 'Poppins,sans-serif' }}>{m.username}</p>
                                    <p style={{ color: 'whitesmoke', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.uid}</p>
                                    <p style={{ color: m.firstd ? 'black' : 'white', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.firstd ? 'active' : 'not active'}</p>
                              
                                </Stack>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{m.balance} USDT</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{fullDate}</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>Referral: {m.newrefer}</p>
                                </Stack>
                            </Stack>
                        </motion.div>
                        )
                    })
                }
                <Stack direction='row' alignItems="center" justifyContent='start' sx={{ width: '100vw', padding: '8px' }}>
                    <p style={{ fontSize: '17px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E5F993' }}>Level 3</p>
                </Stack>
                {
                    lvlbd.map((m) => {
                        let date = new Date(m.crdate);
                        let day = date.getDate();
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        let fullDate = day + '/' + month + '/' + year;
                        return (
                            <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.6 }}
                            key={m.uid}
                            onClick={() => {
                                router.push(`/full/${m.uid}`)
                            }}
                        >
                            <Stack
                                spacing={2}
                                direction='row' alignItems="center" justifyContent='start'
                                sx={{ width: '310px', padding: '6px', borderRadius: '8px', background: '#F56960' }}
                                onClick={() => {
                                    router.push(`/full/${m.uid}`)
                                }}>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', margin: 0, fontFamily: 'Poppins,sans-serif' }}>{m.username}</p>
                                    <p style={{ color: 'whitesmoke', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.uid}</p>
                                    <p style={{ color: m.firstd ? 'black' : 'white', fontWeight: '300', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>{m.firstd ? 'active' : 'not active'}</p>
                              
                                </Stack>
                                <Stack>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{m.balance} USDT</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>{fullDate}</p>
                                    <p style={{ color: '#F2EDEB', fontFamily: 'Poppins,sans-serif', margin: 0 }}>Referral: {m.newrefer}</p>
                                </Stack>
                            </Stack>
                        </motion.div>
                        )
                    })
                }

            </Stack>
        </div>
    )
}
export async function getServerSideProps(context) {
    const id = context.query.id;
    try {
        const { data: depe, error: derror } = await supabase
            .from('users')
            .select('*')
            .or(`refer.eq.${id},lvla.eq.${id},lvlb.eq.${id}`)
        const referd = depe.filter(i => i['refer'] === id);
        const lvlad = depe.filter(i => i['lvla'] === id);
        const lvlbd = depe.filter(i => i['lvlb'] === id);
        console.log(referd, lvlad, lvlbd);
        console.log(depe);
        const { data: getUser ,error:getError } = await supabase
        .from('users')
        .select('*')
        .eq('newrefer',id)
        const { data: getup1, error:geterrup1} = await supabase
        .from('users')
        .select('*')
        .or(`newrefer.eq.${getUser[0].refer},newrefer.eq.${getUser[0].lvla},newrefer.eq.${getUser[0].lvlb}`)
        return {
            props: {
                refid:getUser[0],
                referd: referd,
                lvlad: lvlad,
                lvlbd: lvlbd,
                getup1:getup1,
            },
        }
    } catch (e) {
        console.log(e);
        const referd = [];
        const lvlad = [];
        const lvlbd = [];
        const getup1 = [];
        const vi = {};
        return {
            props: {
                refid:vi,
                referd: referd,
                lvlad: lvlad,
                lvlbd: lvlbd,
                getup1:getup1,
            },
        }
    }

}