import { Stack } from '@mui/material';
import Head from 'next/head';
import Image from "next/image";
import { styled } from '@mui/material/styles';
import Logo from '@/public/favicon.ico';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cover from '../cover'
import FormControl from '@mui/material/FormControl';
import Loading from "@/pages/components/loading";
import toast, { Toaster } from "react-hot-toast";
import IDRBANK from '@/pages/api/idrbanks.json';
import { motion } from "framer-motion";
import NativeSelect from '@mui/material/NativeSelect';
import InputBase from '@mui/material/InputBase';
import { supabase } from "@/pages/api/supabase";
import { CookiesProvider, useCookies } from 'react-cookie';

 
export default function Home({ wallets }) {
    const router = useRouter();
    const [cookies, setCookie] = useCookies(['authdata']);
    const [amount, setAmount] = useState('');
    const [wallet, setWallet] = useState([]);
    const [address, setAddress] = useState('')
    const [ uids,setUids] = useState('');
    const data = cookies.authdata;
    const [bank, setBank] = useState('')
    const [accountnumber, setAccountNumber] = useState('')
    const [accountname, setAccountName] = useState('')
    const [curcode,setCurcode] = useState('usdt');
    const [type, setType] = useState('');
    const handleChange = (event) => {
        const [v, t,cc] = event.target.value.split('-')
        setWallet(event.target.value);
        setType(t)
        setCurcode(cc);
        console.log(event.target.value)
    };

    const handleBhange = (event) => {
        setBank(event.target.value);
    };
    //the below controls the loading modal
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    //the end of thellaoding modal control
    const updata = data;
    useEffect(() => {
        setUids(localStorage.getItem('signNames'));
        // if (!localStorage.getItem('token')) {
        //     router.push('/login')
        // }
    }, [uids]);



    function CryptoOptions({ image }) {
        return (
            <motion.div whileTap={{ scale: 0.9 }}>
                <Stack direction="column" alignItems="center" justifyContent={"center"} style={{ width: '55px', height: '42px', borderRadius: '4px', border: '1px solid #4C4A44' }}>
                    <Image src={image} width={32} height={32} alt="bitcoin" />
                </Stack>
            </motion.div>
        )
    }

    const methodx = {
        "bitcoin": "Bitcoin",
        "usdt": "USDT",
        "eth": "ETH",
        "tron": "TRON"
    };

    const rate = {
        "bitcoin": 0.000018,
        "usdt": 1,
        "eth": 0.00032,
        "tron": 8
    }
    const nextfund = () => {
        try {
            if (type === 'local') {
                if (accountname.length < 3 || accountnumber < 3 || bank < 3 || wallet < 3) {
                    toast('Please fill all details correctly',
                        {
                            icon: '🤦‍♀️',
                            style: {
                                borderRadius: '10px',
                                background: '#DE1A1A',
                                color: '#fff',
                            },
                        }
                    );
                } else {
                    //send the data
                    const make = async () => {
                        try {
                            handleOpen();
                            const response = await fetch('/api/bindwallet', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ type: type, wallet: accountnumber, name: accountname, bank: wallet, uid: uids })
                            });
                            const datax = await response.json();
                            if (datax.status == 'success') {
                                toast('Binding Wallet successful',
                                    {
                                        icon: '🥳',
                                        style: {
                                            borderRadius: '10px',
                                            background: '#26A69A',
                                            color: '#fff',
                                        },
                                    }
                                );
                                router.push('/user/account');

                            } else {
                                toast.error(datax.message)
                                handleClose();
                            }
                        } catch (e) {
                            console.log(e)
                            handleClose();
                        }
                    }
                    make();
                }
            } else {
                // this is for crypto methods
                if (address < 3 || wallet < 3) {
                    toast('Please fill all details correctly',
                        {
                            icon: '🤦‍♀️',
                            style: {
                                borderRadius: '10px',
                                background: '#DE1A1A',
                                color: '#fff',
                            },
                        }
                    );
                } else {
                    //send the data
                    const make = async () => {
                        try {
                            handleOpen();
                            const response = await fetch('/api/bindwallet', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ wallet: address, type: type, name: "", bank: wallet, uid: uids })
                            });
                            const data = await response.json();
                            if (data.status == 'success') {
                                toast('Binding Wallet successful',
                                    {
                                        icon: '🥳',
                                        style: {
                                            borderRadius: '10px',
                                            background: '#26A69A',
                                            color: '#fff',
                                        },
                                    }
                                );
                                handleClose();
                                router.back();

                            } else {
                                toast.error(data.message)
                                handleClose();
                            }
                        } catch (e) {
                            console.log(e)
                            handleClose();
                        }
                    }
                    make();
                }
            }
        } catch (e) {
            console.log(e);
        }
    }



    const BootstrapInput = styled(InputBase)(({ theme }) => ({
        'label + &': {
            marginTop: theme.spacing(3),
        },
        '& .MuiInputBase-input': {
            borderRadius: 4,
            position: 'relative',
            backgroundColor: '#212121',
            color: '#D9D8D4',
            border: '1px solid #ced4da',
            fontSize: 13,
            fontWeight: 'bold',
            padding: '10px 26px 10px 12px',
            transition: theme.transitions.create(['border-color', 'box-shadow']),
            // Use the system font instead of the default Roboto font.
            fontFamily: [
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'Roboto',
                '"Helvetica Neue"',
                'Arial',
                'sans-serif',
                '"Apple Color Emoji"',
                '"Segoe UI Emoji"',
                '"Segoe UI Symbol"',
            ].join(','),
            '&:focus': {
                borderRadius: 4,
                borderColor: '#80bdff',
                boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
            },
        },
    }));


    return (
        <Cover>
            <Toaster position="bottom-center"
                reverseOrder={false} />
            <Head>
                <title>BIND WALLET</title>
            </Head>
            <Loading open={open} handleClose={handleClose} />
            <Stack direction="column" spacing={3} justifyContent="center" alignItems="center" sx={{ minWidth: '350px', width: '100%', height: '100%' }} >

                <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ marginTop: '20px', marginBottom: "20px", background: 'none', minWidth: "350px", paddingBottom: '30px', width: '100%', maxWidth: '450px' }}>
                    <Stack direction="column" alignItems="center" justifyContent={"center"} spacing={3} sx={{ background: '#373636', padding: '16px', borderRadius: '8px', minWidth: "350px", maxWidth: '450px' }}>
                        <Stack direction="row" alignItems="center" justifyContent={"space-between"} sx={{ width: '100%' }}>
                            <p style={{ color: '#D9D8D4', fontWeight: '700', fontSize: '14px' }}>BIND WALLET</p>
                        </Stack>
                        <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '8px', width: '100%', borderRadius: '8px' }}>
                            <p className='normal-bold' style={{ textAlign: 'start' }}>Select Payment Method</p>
                            <FormControl sx={{ m: 1, width: '100%', maxWidth: '301px' }} variant="standard">
                                <NativeSelect
                                    id="demo-customized-select-native"
                                    value={wallet}
                                    onChange={handleChange}
                                    input={<BootstrapInput />}
                                >
                                    <option aria-label="None" value="" style={{ color: '#D9D8D4', background: '#212121' }} />
                                    {
                                        wallets.map((w) => {
                                            return (
                                                <option key={w.name} value={w.name + '-' + w.type + '-' + w.currency_code} style={{ color: '#D9D8D4', background: '#212121' }}>{w.name.toUpperCase()}</option>
                                            )
                                        })
                                    }
                                </NativeSelect>
                            </FormControl>
                        </Stack>

                        {
                            (type === 'local') ?
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>Account Number</p>
                                        <input type="text" className="amountinput" placeholder="account number" value={accountnumber} onChange={(e) => {
                                            if (!isNaN(e.target.value)) {
                                                setAccountNumber(e.target.value)
                                            }
                                        }} />
                                    </Stack>

                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>Account Name</p>
                                        <input type="text" className="amountinput" placeholder="account name" value={accountname} onChange={(e) => {

                                            setAccountName(e.target.value)
                                        }} />
                                    </Stack>


                                            {
                                                (curcode === 'idr') ? 
                                                <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                                <p className='normal-bold' style={{ textAlign: 'start' }}>Select Bank</p>
                                                <FormControl sx={{ m: 1, width: '100%', maxWidth: '301px' }} variant="standard">
                                                    <NativeSelect
                                                        id="demo-customized-select-native"
                                                        value={bank}
                                                        onChange={handleBhange}
                                                        input={<BootstrapInput />}
                                                    >
                                                        <option aria-label="None" value="" style={{ color: '#D9D8D4', background: '#212121' }} />
                                                        {
                                                            IDRBANK.map((w) => {
                                                                return (
                                                                    <option key={w.name} value={w.name} style={{ color: '#D9D8D4', background: '#212121' }}>{w.name.toUpperCase()}</option>
                                                                )
                                                            })
                                                        }
                                                    </NativeSelect>
                                                </FormControl>
                                            </Stack>
                                                :
                                                <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '12px', width: '100%', borderRadius: '8px' }}>
                                                <p className='normal-bold' style={{ textAlign: 'start' }}>Input your bank name</p>
                                                <input type="text" className="amountinput" placeholder="bank name" value={bank} onChange={(e) => {
        
                                                    setBank(e.target.value)
                                                }} />
                                            </Stack>
                                            }
                                   
                                </>

                                :
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#242627', padding: '12px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>Input your address</p>
                                        <input type="text" className="amountinput" placeholder="wallet address" value={address} onChange={(e) => {

                                            setAddress(e.target.value)
                                        }} />
                                    </Stack>


                                </>

                        }

                        <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.02 }} onClick={nextfund} style={{ width: '100%', height: '45px' }}>
                            <Stack className="powerbtn" direction="column" alignItems="center" justifyContent={"center"} sx={{}}>
                                <p className="normal-bold" style={{ fontWeight: 'bold' }}>BIND WALLET</p>
                            </Stack>
                        </motion.div>
                    </Stack>
                    <p onClick={() => router.back()} style={{ fontSize: '16px', fontWeight: 'bold', color: '#26A69A', textAlign: 'center', width: '100%', padding: '8px', textDecoration: 'underline', cursor: 'pointer' }}> Back</p>

                </Stack>


            </Stack>
        </Cover>
    )
}

export const getServerSideProps = async (context) => {

    try {
        const { data: wallets, error: walleterror } = await supabase
            .from('walle')
            .select('*')
            console.log(wallets)
        return {
            props: { wallets: wallets }
        }
    } catch (e) {
        return {
            props: { wallets: [] }
        }
    }


}