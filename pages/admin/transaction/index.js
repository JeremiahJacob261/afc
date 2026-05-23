import { Stack, TextField } from "@mui/material"
import { Button } from "@mui/material"
import { useState } from "react"
import { useRouter } from 'next/router'
import { motion } from "framer-motion"
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from "react"
import { Icon } from "@iconify/react"
import Modal from "@mui/material/Modal"
import Image from "next/image"
import { supabase } from "@/pages/api/supabase"
export default function Home({ notification }) {
    const router = useRouter();
    const id = router.query.id;
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    function DataShow() {
            const [opened, setOpened] = useState(false);
            const [address, setAddress] = useState("");
        if (notification && notification.length == 0) {
            return (
                <p>No Transaction Data Available</p>
            )
        } else {
            const handleClick = (adds) => {
                setOpened(true);
                setAddress(adds);
            };

            const handleClosed = (event, reason) => {
                if (reason === 'clickaway') {
                    return;
                }

                setOpened(false);
            };
            return (
                <Stack direction="column" spacing={2}>
                    {
                        notification.map((e) => {
                            let date = new Date(e.time);
                            let day = date.getDate();
                            let month = date.getMonth() + 1;
                            let year = date.getFullYear();
                            let hours = date.getHours();
                            let minutes = date.getMinutes();
                            let data = e;
                            let datestring = `${day}/${month}/${year} ${hours}:${minutes}`;
                            return (
                                <Stack direction="column" justifyContent='center' alignItems='center' spacing={2} sx={{ background: '#420b16',width:'300px', padding: '8px', borderRadius: '8px' }} key={e.id}>
                                    <Toaster
                                        position="bottom-center"
                                        reverseOrder={false}
                                        toastOptions={{
                                            style: {
                                                fontSize: '14px',
                                                background: '#ad1c39',
                                                color: '#fff',
                                            },
                                            iconTheme: {
                                                primary: 'white',
                                                secondary: 'rgba(194,127,8,1)',
                                            },
                                        }}
                                    />

                                    <Modal
                                        open={opened}
                                        onClose={handleClosed}
                                        aria-labelledby="modal-modal-title"
                                        aria-describedby="modal-modal-description"
                                    >
                                        <Stack >
                                            <Icon icon="iconoir:cancel" width={50} height={50} alt="withdraw" style={{ color: 'red', position: 'fixed', top: '10%', padding: '8px', left: '47%' }}
                                                onClick={() => {
                                                    setOpened(false)
                                                }} />

                                            <Image src={address} width={200} height={200} alt='image_proof' style={{ maxWidth: '310px', maxHeight: '200px', position: 'fixed', top: '30%', left: '40%' }} />
                                        </Stack>
                                    </Modal>
                                        <p>{e.username}</p>
                                        <p> Date: {datestring}</p>
                                        <p>{e.amount} USDT</p>
                                        <p>{e.type}</p>
                                    <p>{(e.address === 'admin') ?  "Reason : " + e.method : "STATUS : " + e.sent}</p>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.6 }}
                                        onClick={() => {
                                            if (data.type === 'deposit') {
                                                handleClick(data.address)
                                            } else {
                                                console.log(data.address)
                                                navigator.clipboard.writeText(data.address)
                                                toast.success('Copied to clipboard');
                                            }
                                        }}
                                    >
                                        <Icon icon={(data.type === 'deposit') ? 'mynaui:image' : 'solar:copy-bold-duotone'} width={24} height={24} alt="stats"
                                            onClick={() => {
                                                if (data.type === 'deposit') {
                                                    handleClick(data.address)
                                                } else {
                                                    console.log(data.address)
                                                    navigator.clipboard.writeText(data.address)
                                                    toast.success('Copied to clipboard');
                                                }
                                            }}
                                        />
                                    </motion.div>
                                </Stack>
                            )
                        })
                    }
                </Stack>
            )
        }
    }
    return (
        <div>
              <Icon icon="iconoir:cancel" color="gray" width="100" height="100" onClick={() => {
                    router.push(`/admin/full/${id}`)
                }} />
            <h1 style={{ color:'wheat'}}>Transaction</h1>
            <DataShow />
        </div>
    )
}
export async function getServerSideProps(context) {
    let id = context.query.id;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('uid', id);
        let username = data[0].username;
        const { data: trans, error: transerror } = await supabase
            .from('notification')
            .select('*')
            .eq('username', username)
            .order('id', { ascending: false })
        console.log(trans)
        console.log(error)
        if (transerror) {
            console.log(transerror);
        }
        return {
            props: {
                notification: trans
            },
        }
    } catch (e) {
        console.log(e)
        let trans = [];
        return {
            props: {
                notification: trans
            },
        }
    }
}
