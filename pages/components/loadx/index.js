import { Stack } from '@mui/material';
import Modal from '@mui/material/Modal';
import { useState } from 'react';
import Image from 'next/image';
import Logo from '@/public/bradford.ico'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router';
import Refresh from '@/public/refresh.png';

export default function Loadingx({ open, handleClose,currency }) {
    const router = useRouter();
    if (!open) return null;
    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            style={{ outline: 0 }}
        >
            <Stack className="loading" direction="column" alignItems="center" justifyContent={"center"} sx={{ outline: 0, width: '100%', height: '100vh' }}>
                {
                    (currency === 'fcfa') ? 
                    <Stack direction="column" spacing={2} alignItems="center" justifyContent={"center"} sx={{ padding: '12px', width: '300px', height: 'auto', background: '#353431', borderRadius: '16px' }}>
                
                    <Stack direction='column' alignItems="center" justifyContent={"center"}>
                        
                        <Image src={Logo} alt="bradford fc" width={70} height={70} />
                        <p style={{ color: '#CACACA', width: '100%', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>Choose any Transaction method</p>
                        <p style={{ color: '#CACACA', width: '100%', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '300', fontSize: '13px' }}>you can Choose any transaction type that is available in your location</p>
                    </Stack>

                    <motion.div whileTap={{ scale: 0.8 }} style={{ width: '100%',cursor:'pointer' }} 
                    onClick={()=>{
                         localStorage.setItem('dm','fcfa');
                         localStorage.setItem('dmmv','wave');
                         router.push('/user/inputvalue?dm=fcfa');
                    }}>
                        <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ padding: '8px', width: '100%', height: '60px', background: '#242627', borderRadius: '8px' }}>
                            <p style={{ color: '#E94E55', width: '100%', margin: '0', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>TRANSFER 1: WAVE</p>
                        </Stack>
                    </motion.div>


                    <motion.div whileTap={{ scale: 0.8 }} style={{ width: '100%',cursor:'pointer' }}
                     onClick={()=>{
                         localStorage.setItem('dm','fcfa');
                         localStorage.setItem('dmmv','mtn');
                         router.push('/user/inputvalue?dm=fcfa');
                    }}>
                        <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ padding: '8px', width: '100%', height: '60px', background: '#242627', borderRadius: '8px' }}>
                            <p style={{ color: '#E94E55', width: '100%', margin: '0', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>TRANSFER 2: MTN MONEY</p>
                        </Stack>
                    </motion.div>


                </Stack>
                
                    :

                    <Stack direction="column" spacing={2} alignItems="center" justifyContent={"center"} sx={{ padding: '12px', width: '300px', height: 'auto', background: '#353431', borderRadius: '16px' }}>
                
                    <Stack direction='column' alignItems="center" justifyContent={"center"}>
                        
                        <Image src={Logo} alt="bradford fc" width={70} height={70} />
                        <p style={{ color: '#CACACA', width: '100%', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>Choose any Transaction method</p>
                        <p style={{ color: '#CACACA', width: '100%', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '300', fontSize: '13px' }}>you can Choose any transaction type that is available in your location</p>
                    </Stack>

                    <motion.div whileTap={{ scale: 0.8 }} style={{ width: '100%',cursor:'pointer' }} 
                    onClick={()=>{
                         localStorage.setItem('dm','mmk');
                         localStorage.setItem('dmmv','wave');
                         router.push('/user/inputvalue?dm=mmk');
                    }}>
                        <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ padding: '8px', width: '100%', height: '60px', background: '#242627', borderRadius: '8px' }}>
                            <p style={{ color: '#E94E55', width: '100%', margin: '0', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>TRANSFER 1: WAVE</p>
                        </Stack>
                    </motion.div>


                    <motion.div whileTap={{ scale: 0.8 }} style={{ width: '100%',cursor:'pointer' }}
                     onClick={()=>{
                         localStorage.setItem('dm','mmk');
                         localStorage.setItem('dmmv','kpay');
                         router.push('/user/inputvalue?dm=mmk');
                    }}>
                        <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ padding: '8px', width: '100%', height: '60px', background: '#242627', borderRadius: '8px' }}>
                            <p style={{ color: '#E94E55', width: '100%', margin: '0', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>TRANSFER 2: KPAY</p>
                        </Stack>
                    </motion.div>

                    <motion.div whileTap={{ scale: 0.8 }} style={{ width: '100%',cursor:'pointer' }}
                     onClick={()=>{
                         localStorage.setItem('dm','mmk');
                         localStorage.setItem('dmmv','kbz');
                         router.push('/user/inputvalue?dm=mmk');
                    }}>
                        <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ padding: '8px', width: '100%', height: '60px', background: '#242627', borderRadius: '8px' }}>
                            <p style={{ color: '#E94E55', width: '100%', margin: '0', textAlign: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: '600', fontSize: '16px' }}>TRANSFER 3: KBZ Bank</p>
                        </Stack>
                    </motion.div>

                </Stack>
                }
            </Stack>
        </Modal>
    )
}