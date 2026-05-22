import React from 'react'
import HomeBottom from '../bottomNav'
import { Stack } from '@mui/material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
export default function Controls() {
    const router = useRouter();
    return (
        <Stack direction='column' alignItems='center' spacing={1} sx={{ width: '100vw', height: '100vh', padding: '8px' }}>
            <h1>Control</h1>
            <Stack direction='column' spacing={2} sx={{ height: '100vh', width: '100vw' }} alignItems='center'>
                <Stack direction='row' className='financerow' justifyContent='space-between' alignItems='center'>
                    <p style={{ color: 'whitesmoke', fontWeigth: '300', fontSize: '15px', fontFamily: 'Poppins,sans-serif' }}>Generate Bonus Claim Code</p>
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        onClick={() => {
                            router.push('/admin/generate')
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Icon icon='eva:expand-outline' width={30} height={30} style={{ color: 'white' }} onClick={() => {
                            router.push('/admin/generate')
                        }} />
                    </motion.div>

                </Stack>

                <Stack direction='row' className='financerow' justifyContent='space-between' alignItems='center'  
                onClick={() => {
                            router.push('/admin/paymentmthod')
                        }}>
                    <p style={{ color: 'whitesmoke', fontWeigth: '300', fontSize: '15px', fontFamily: 'Poppins,sans-serif' }}>Payment Wallets</p>
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        onClick={() => {
                            router.push('/admin/paymentmthod')
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Icon icon='eva:expand-outline' width={30} height={30} style={{ color: 'white' }} onClick={() => {
                            router.push('/admin/paymentmthod')
                        }} />
                    </motion.div>

                </Stack>

                <Stack direction='row' className='financerow' justifyContent='space-between' alignItems='center'>
                    <p style={{ color: 'whitesmoke', fontWeigth: '300', fontSize: '15px', fontFamily: 'Poppins,sans-serif' }}>Announcement</p>
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        onClick={() => {
                            router.push('/admin/broadcast')
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Icon icon='eva:expand-outline' width={30} height={30} style={{ color: 'white' }} onClick={() => {
                            router.push('/admin/broadcast')
                        }} />
                    </motion.div>
                </Stack>
                <Stack direction='row' className='financerow' justifyContent='space-between' alignItems='center'>
                    <p style={{ color: 'whitesmoke', fontWeigth: '300', fontSize: '15px', fontFamily: 'Poppins,sans-serif' }}>Change Password</p>
                    <Icon icon='mi:edit' width={30} height={30} style={{ color: 'white' }} />
                </Stack>
            </Stack>
            <HomeBottom />
        </Stack>
    )
}