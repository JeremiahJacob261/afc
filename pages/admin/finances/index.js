import { Modal, Stack, Typography, TextField } from "@mui/material"
import React, { useRef } from "react"
import { Icon } from '@iconify/react';
import { supabase } from "../api/supabase";
import { useRouter } from "next/router";
import toast, { Toaster } from 'react-hot-toast';
import HomeBottom from "../bottomNav"
import logoPKR from '@/public/pkr.png'
import logoUsdt from '@/public/tether.png'
import { motion } from "framer-motion";
import { useState } from "react";
import Image from 'next/image'
import { useEffect } from "react";
import LoadingBar from 'react-top-loading-bar'
import BCA from '@/public/bca.jpg'
export default function Finances() {
    let type = 'deposit';
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState()
    const [drop, setDrop] = useState(false);

    //rates
    const rates = {
        'mmk': 5000,
        'usdt': 1,
        'idr': 16500,
        'ngn': 1500,
        'fcfa': 600,
        'pkr': 280,
        'kes':130
    }
    //end of rates
    //upadate array
    function updateObjectInArray(array, id, updatedObject) {
        return array.map((obj) => {
            if (obj.id === id) {
                return { ...obj, ...updatedObject };
            }
            return obj;
        });
    }

    //useEffect
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notification')
                .select()
                .neq('address', 'admin')
                .limit(150)
                .order('id', { ascending: false });
            setNotifications(data);
        }
        fetchNotifications();

    }, [notifications]);

    //important functions
    const ref = useRef(null)
    const updateS = async (uid) => {
        const { error } = await supabase
            .from('notification')
            .update({ sent: 'success' })
            .eq('uid', uid)
    }
    const updateC = async (uid) => {
        const { error } = await supabase
            .from('notification')
            .update({ sent: 'failed' })
            .eq('uid', uid)
    }
    const Depositing = async (damount, dusername) => {
        const { data, error } = await supabase
            .rpc('depositor', { amount: damount, names: dusername })
        console.log(error);
    }
    const SEL = async (damount, dusername) => {
        const { data, error } = await supabase
            .rpc('self', { amount: (damount < 10) ? 0 : damount * 0.1, name: dusername })
        console.log(error);
    }
    const uploadTotal = async (dname, damount) => {
        try {
            const { data, error } = await supabase
                .rpc('gatherd', { names: dname, amount: parseFloat(damount) })
            console.log('totald', error)
        } catch (e) {
            console.log(e)
        }
    }
    const uploadTotalWithdraw = async (dname, damount) => {
        try {
            const { data, error } = await supabase
                .rpc('gatherw', { names: dname, amount: parseFloat(damount) })
            console.log('totalw', error)
        } catch (e) {
            console.log(e)
        }
    }

    const RefBonus = async (damount, dusername, refer, lvla, lvlb) => {
        const { data, error } = await supabase
            .rpc('refbonus', { amount: damount, name: dusername, refers: refer, lvls: lvla, lvlss: lvlb })
        console.log(error);
    }
    const Reads = async (dtype, damount) => {
        const { data, error } = await supabase
            .rpc(dtype, { amount: damount })
        console.log(error);
    }

    //bonuses adding
    const selfBonus = async (damount, dusername) => {
        //check if user is eligible for bonus
        let el = {};
        const eligible = async (dusername, damount) => {
            const { data, error } = await supabase
                .from('users')
                .select()
                .eq('username', dusername);
            let el = data[0];
            console.log(el.firstd);
            if (!el.firstd) {
                if (damount > 99999) {
                    SEL(damount, dusername);
                    RefBonus(damount, dusername, el.refer, el.lvla, el.lvlb);
                }
            } else {

            }
        }
        eligible(dusername, damount)
        //end of check
        console.log(el)
    }
    //end of bonuses adding
    //end of important functions
    function ActionControl({ data, method }) {
        if (data.sent === 'pending') {
            return (
                <Stack direction='column' className="actreal">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.6 }}
                    >
                        <Icon icon="fluent-mdl2:accept-medium" width={24} height={24} alt="withdraw" style={{ color: 'green' }}
                            onClick={() => {
                                if (method != 'usdt') {
                                    if (data.type === 'withdraw') {
                                        updateS(data.uid);
                                        Reads('readwithdraw', parseFloat((data.amount * rates[data.method]).toFixed(3)))
                                        uploadTotalWithdraw(data.username, parseFloat((data.amount * rates[data.method]).toFixed(3)))
                                        alert('Withdraw confirmed')
                                    } else {
                                        Depositing(parseFloat((data.amount / rates[data.method]).toFixed(3)), data.username);
                                        selfBonus(parseFloat((data.amount / rates[data.method]).toFixed(3)), data.username);
                                        uploadTotal(data.username, parseFloat((data.amount / rates[data.method]).toFixed(3)))
                                        Reads('readdeposit', parseFloat((data.amount / rates[data.method]).toFixed(3)))
                                        updateS(data.uid);
                                        alert('Deposit confirmed')
                                    }
                                } else {
                                    if (data.type === 'withdraw') {
                                        updateS(data.uid);
                                        Reads('readwithdraw', data.amount)
                                        uploadTotalWithdraw(data.username, data.amount)
                                        alert('Withdraw confirmed')
                                    } else {
                                        Depositing(parseFloat((data.amount * rates[data.method]).toFixed(3)), data.username);
                                        selfBonus(parseFloat((data.amount * rates[data.method]).toFixed(3)), data.username);
                                        uploadTotal(data.username, parseFloat((data.amount * rates[data.method]).toFixed(3)))
                                        Reads('readdeposit', parseFloat((data.amount * rates[data.method]).toFixed(3)))
                                        updateS(data.uid);
                                        alert('Deposit confirmed')
                                    }
                                }
                            }}
                        />
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.6 }}
                    >
                        <Icon icon="iconoir:cancel" width={24} height={24} alt="withdraw" style={{ color: 'red' }}
                            onClick={() => {
                                if (data.method != 'usdt') {
                                    if (data.type === 'deposit') {
                                        ref.current.continuousStart();
                                        updateC(data.uid);
                                        alert('Deposit cancelled')
                                        router.push('/admin/finances')
                                        window.location.reload()
                                        ref.current.complete()
                                    } else {
                                        ref.current.continuousStart()
                                        Depositing(parseFloat((parseFloat(data.amount) / 0.92).toFixed(2)), data.username);
                                        updateC(data.uid);
                                        alert('Withdraw cancelled')
                                        router.push('/admin/finances')
                                        window.location.reload()
                                        ref.current.complete()
                                    }
                                } else {
                                    if (data.type === 'deposit') {
                                        ref.current.continuousStart();
                                        updateC(data.uid);
                                        alert('Deposit cancelled')
                                        router.push('/admin/finances')
                                        window.location.reload()
                                        ref.current.complete()
                                    } else {
                                        ref.current.continuousStart()
                                        Depositing(parseFloat((parseFloat(data.amount) / 0.92).toFixed(2)), data.username);
                                        updateC(data.uid);
                                        alert('Withdraw cancelled')
                                        router.push('/admin/finances')
                                        window.location.reload()
                                        ref.current.complete()
                                    }
                                }
                            }}
                        />
                    </motion.div>
                </Stack>
            )
        } else {
            return (
                <Stack direction='column' className="actreal">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.6 }}
                    >
                        <Icon icon="octicon:tracked-by-closed-completed-24" color={(data.sent === "failed") ? "red" : "greenyellow"} width={24} height={50} alt="icon_actio" />
                    </motion.div>
                </Stack>
            )
        }
    }

    //search activity

    function SearchActivity() {
        const [searchValue, setSearchValue] = useState('');

        const searchName = async () => {
            ref.current.continuousStart();
            try {
                let test = await fetch('https://admin.dfco1.com/api/finances', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ find: searchValue })
                }).then(data => {
                    return data.json();
                })
                setNotifications(test);
                setSearchValue(test[0].username ?? '');
                ref.current.complete();
            } catch (e) {
                console.log(e);
                ref.current.complete();
                alert('Unknown Error Ocurred, Please Try Again');
                let test = [];
                setNotifications(notification);
            }
        }

        const clear = () => {
            setSearchValue('');
            setNotifications(notification);
        }
        return (
            <Stack sx={{ width: '100vw', height: '50px' }} justifyContent="center" alignItems='center'>
                <Stack direction="row" justifyContent="center" alignItems='center' style={{ width: '80%', height: '100%', borderRadius: '10px', background: '#530414', padding: '8px' }}>
                    <TextField
                        value={searchValue}
                        onChange={(s) => {
                            let willIconShow = s.target.value;

                            setSearchValue(s.target.value);
                        }}
                        variant="outlined"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& > fieldset": {
                                        border: 'none'
                                    }
                                },
                                "& input": {
                                    color: 'white'
                                }
                            }
                        }}
                        placeholder="Search Transaction By Username"
                        sx={{
                            "& .MuiInputLabel-root": {
                                color: 'white'
                            },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                    border: 'none'
                                }
                            },
                            flex: 1,
                            letterSpacing: 2
                        }}
                    />
                    <motion.div whileTap={{ scale: 0.6 }} whileHover={{ scale: 1.05 }} onClick={searchName}>
                        <Icon icon="mynaui:search" color="gray" width={24} height={24} alt="search" />
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.6 }} whileHover={{ scale: 1.05 }} onClick={clear}>
                        <Icon icon="iconoir:cancel" color="red" width="24" height="24" hFlip={true} style={{ display: 'visible' }} />
                    </motion.div>
                </Stack>
            </Stack>
        )
    }
    //end of search activity
    function FinRow() {
        const [opened, setOpened] = useState(false);
        const [address, setAddress] = useState("");
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
            <Stack direction='column' spacing={2} >

                {
                    notifications.map((data) => {
                        let date = new Date(data.time);
                        let day = date.getDate();
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        let hour = date.getHours();
                        let minute = date.getMinutes();
                        let fullDay = day + ' / ' + month + ' / ' + year + ' ' + hour + ':' + minute;

                        return (
                            <Stack key={data.id} direction='row' className='financerow' justifyContent='space-between' alignItems='center'>

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
                                <Icon icon={(data.type === 'deposit') ? "mingcute:arrow-down-fill" : 'mdi:arrow-up'} color={(data.type === 'deposit') ? 'green' : 'red'} width={32} height={32} />
                                <Stack sx={{ width: '70vw', height: '100%' }}>
                                    <Typography sx={{ height: '12px', fontWeight: '600', margin: '8px', fontFamily: 'Poppins,sans-serif' }}>{data.username}</Typography>
                                    <Stack direction='row' justifyContent="start" alignItems='center' spacing={1} sx={{ padding: '8px' }}>
                                        <Image src={(data.method === 'idr' || data.method === 'bca') ? BCA : (data.method === 'pBkr') ? logoPKR : logoUsdt} width={25} height={20} alt="usdt" style={{ background: 'white', padding: '1px', borderRadius: '5px' }} />
                                        <Typography sx={{ height: '12px', margin: '8px', fontFamily: 'Poppins,sans-serif' }} className="ppp">{parseFloat(data.amount).toFixed(3)} {(data.type === 'deposit') ? data.method.toUpperCase() : 'usdt'},   {(data.type != 'deposit') ? parseFloat(data.amount * rates[data.method]).toFixed(3) + " " + data.method : (data.method === 'usdt') ? parseFloat(data.amount * rates[data.method]).toFixed(3) + " " + data.method : parseFloat(data.amount / rates[data.method]).toFixed(3) + " USDT"}</Typography>
                                    </Stack>
                                    <Typography sx={{ height: '12px', margin: '8px', color: 'grey', fontFamily: 'Poppins,sans-serif' }} className="ppp">{fullDay}</Typography>
                                    <Typography sx={{ height: '10px', margin: '1px', color: 'grey', fontFamily: 'Poppins,sans-serif' }} className="ppp">{(data.type === 'deposit') ? 'admin address-> ' + data.adminaddress : (data.method != 'usdt') ? data.bank + ' : ' + data.accountname + ' : ' + data.address : data.address}</Typography>

                                </Stack>
                                <Stack direction="row" spacing={2} alignItems='center' className="actions">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.6 }}
                                    >
                                        <Icon icon={(data.type === 'deposit') ? 'mynaui:image' : 'solar:copy-bold-duotone'} width={24} height={24} alt="stats" color='white'
                                            onClick={() => {
                                                if (data.type === 'deposit') {
                                                    window.open(data.address, "_blank");
                                                } else {
                                                    console.log(data.address)
                                                    navigator.clipboard.writeText(data.address)
                                                    toast.success('Copied to clipboard');
                                                }
                                            }}
                                        />
                                    </motion.div>

                                    <ActionControl data={data} method={data.method} />

                                </Stack>
                            </Stack>
                        )
                    })
                }
            </Stack>
        )
    }
    return (
        <Stack direction='column' alignItems='center' spacing={3} sx={{ width: '100vw', minHeight: '100vh' }}>
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
            <h1>Finances</h1>
            <LoadingBar color='#f11946' ref={ref} />
            <SearchActivity />
            <FinRow />
            <HomeBottom />
        </Stack>
    )
}
