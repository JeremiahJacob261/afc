import Cover from "./cover";
import { Stack, Typography, TextField, Button, Divider } from '@mui/material'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from 'framer-motion'
import Modal from '@mui/material/Modal';
import Wig from '../../public/icon/wig.png'
import { Icon } from '@iconify/react'
import { supabase } from "../api/supabase";
import Link from 'next/link'
import Image from 'next/image'
import Loading from "@/pages/components/loading";
import toast, { Toaster } from 'react-hot-toast';

const trfx = {
    'wave':'Wave',
    'mtn':'MTN Money'
};
//let imagesx be the list of images
//let address be the list of address
export async function getServerSideProps(context) {

    const met = context.query.dm;
    if (met === 'fcfa') {
        const trf = context.query.trf;
        const { data, error } = await supabase
        .from('depositwallet')
        .select('*')
        .match({'currency_code': met, 'bank':trfx[trf]})
        return {
            props: {
                pay: data[0],
                // Will be passed to the page component as props
            },
        }
    } else {
        const { data, error } = await supabase
            .from('depositwallet')
            .select('*')
            .eq('currency_code', met)
        console.log(data)
        if (data.length < 1) {

            return {
                props: {
                    pay: data[0],
                    // Will be passed to the page component as props
                },
            }

        } else {
            let constx = Math.floor(Math.random() * data.length);
            console.log(constx)
            return {
                props: {
                    pay: data[constx],
                    // Will be passed to the page component as props
                },
            }
        }
    }

}


export default function Address({ pay }) {
    const router = useRouter();
    const [ale, setAle] = useState('')
    const [open, setOpen] = useState(false)
    const [aleT, setAleT] = useState(false)
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState();
    const Alerts = (m, t) => {
        setAle(m)
        setAleT(t)
        setOpen(true)
    }
    //the below controls the loading modal
    const [openx, setOpenx] = useState(false);
    const handleOpenx = () => setOpenx(true);
    const handleClosex = () => setOpenx(false);

    //the end of thellaoding modal control
    const nextPage = () => {
        console.log('...')
        localStorage.setItem('randomed', pay.address)
        handleOpenx()
        router.push('/user/deposit')

    }
    useEffect(() => {
        setAmount(localStorage.getItem('amo'))
        setMethod(localStorage.getItem('dm'));
    }, [])

    return (
        <Cover>
            <Alertz />
            <Loading open={openx} handleClose={handleClosex} />
            <Stack direction='column' alignItems='center' sx={{ minHeight: '90vh', paddingBottom: '100px' }} spacing={2}>
                <Stack direction='row' alignItems='start' spacing={1} sx={{ padding: '8px', margin: '2px', minWidth: '343px' }}>
                    <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
                        router.push('/user/transaction')
                    }} />
                    <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Payment Address</Typography>
                </Stack>
                <Stack direction='row' justifyContent='center' alignItems='center' sx={{ height: 'auto', maxWidth: '360px', background: '#FBEFEF', borderRadius: '5px', padding: '16px' }} spacing={2}>
                    <PriorityHighRoundedIcon sx={{ color: '#242627', background: '#E94E55', width: '20px', height: '20px', borderRadius: '10px' }} />
                    <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#E94E55' }}>Please note that you are to deposit only {amount} {(pay.currency_code === 'usdt') ? pay.currency_code.toUpperCase() + '(TRC20)' : pay.currency_code.toUpperCase()} to the payment method below.</Typography>
                </Stack>
                <Stack spacing={1} sx={{ minWidth: '344px' }} alignItems={"center"} justifyContent={"center"}>
                    <Image src={pay.image} width={300} height={350} alt="pay with love" style={{ borderRadius: '8px' }} />
                    <Stack direction="row" spacing={1}>
                        <p style={{ color: '#cacaca', fontFamily: 'Poppins,sans-serif', fontSize: '16px', padding: '4px', margin: 2 }}>{pay.address}</p>
                        <Icon icon="solar:copy-bold-duotone" width="24" height="24" style={{ color: '#a3a3a3' }} onClick={() => {
                            navigator.clipboard.writeText(pay.address)
                            toast.success("Address or Account copied")
                        }} />
                    </Stack>
                    {
                        (pay.type === 'local') ?
                            <>
                                <Stack direction="row" spacing={1}>
                                    <p style={{ color: '#cacaca', fontFamily: 'Poppins,sans-serif', fontSize: '16px', padding: '4px', margin: 2 }}>{pay.accountname}</p>
                                    <Icon icon="solar:copy-bold-duotone" width="24" height="24" style={{ color: '#a3a3a3' }} onClick={() => {
                                        navigator.clipboard.writeText(pay.accountname)
                                        toast.success("AccounT Name copied")
                                    }} />
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <p style={{ color: '#cacaca', fontFamily: 'Poppins,sans-serif', fontSize: '16px', padding: '4px', margin: 2 }}>{pay.bank}</p>
                                    <Icon icon="solar:copy-bold-duotone" width="24" height="24" style={{ color: '#a3a3a3' }} onClick={() => {
                                        navigator.clipboard.writeText(pay.bank)
                                        toast.success("Bank Name copied")
                                    }} />
                                </Stack>
                            </>
                            :
                            <></>
                    }
                </Stack>
                <Stack direction='column' justifyContent='space-between' spacing={1} alignItems='center' sx={{ height: 'auto', maxWidth: '360px', background: '#373636', borderRadius: '5px', padding: '12px', margin: '4px' }} >
                    <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#cacaca' }}>You are expected to upload an image of the receipt in the next page within 30 minutes of making the transaction else transferred funds might be lost!.
                    </Typography>
                    <Link href="https://t.me/BFC_HELP" style={{ textDecoration: 'none' }}> <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '13px', color: '#E94E55' }}>Click to Contact Support for more information</p></Link>
                </Stack>
                <motion.div whileTap={{ scale: 1.05 }} style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: "#CACACA", height: '50px', background: '#E94E55', minWidth: '360px', padding: '12px' }} onClick={() => {

                    nextPage()

                }}>Verify Deposit</motion.div> </Stack>
            <Toaster />
        </Cover>
    )
    function Alertz() {
        return (
            <Modal
                open={open}
                onClose={() => {
                    if (aleT) {
                        setOpen(false)
                        router.push('/user/withdrawsuccess')
                    } else {
                        setOpen(false)
                    }
                }}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Stack alignItems='center' justifyContent='space-evenly' sx={{
                    background: '#242627', width: '290px', height: '330px', borderRadius: '20px',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '12px'
                }}>
                    <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh' />
                    <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#cacaca' }}>

                        {aleT ? 'Success' : 'Eh Sorry!'}
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#cacaca' }}>
                        {ale}
                    </Typography>
                    <Divider sx={{ color: '#CACACA' }} />
                    <motion.div whileTap={{ scale: 1.05 }} style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: "#CACACA", height: '50px', background: '#373636', minWidth: '310px', padding: '12px' }} onClick={() => {
                        setOpen(false)
                    }}>Okay</motion.div>

                </Stack>

            </Modal>)
    }
}

