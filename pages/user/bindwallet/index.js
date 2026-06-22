import { Stack } from '@mui/material';
import Head from 'next/head';
import { styled } from '@mui/material/styles';
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
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { waitForPaint } from '@/lib/uiFeedback';


function normalize(value) {
    return String(value || '').trim();
}

function isLocalMethod(type) {
    return ['local', 'local-transfer', 'bank', 'mobile-money'].includes(normalize(type).toLowerCase());
}

export default function Home() {
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [selectedMethodId, setSelectedMethodId] = useState('');
    const [address, setAddress] = useState('')
    const [bank, setBank] = useState('')
    const [accountnumber, setAccountNumber] = useState('')
    const [accountname, setAccountName] = useState('')
    const selectedMethod = paymentMethods.find((method) => String(method.id) === String(selectedMethodId));
    const type = selectedMethod?.type || '';
    const curcode = normalize(selectedMethod?.currency_code || selectedMethod?.name).toLowerCase();
    const isLocal = isLocalMethod(type);
    const handleChange = (event) => {
        setSelectedMethodId(event.target.value);
        setAddress('');
        setBank('');
        setAccountNumber('');
        setAccountName('');
    };

    const handleBhange = (event) => {
        setBank(event.target.value);
    };
    //the below controls the loading modal
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        let active = true;

        const check = async () => {
            const session = await requireSession(router);
            if (!session) return;
            clearLegacyAuthStorage();

            try {
                const { data: methods, error } = await supabase
                    .from('walle')
                    .select('*')
                    .eq('available', true);

                if (error) throw error;
                if (!active) return;

                setPaymentMethods(Array.isArray(methods) ? methods : []);
            } catch (error) {
                console.log(error);
                toast.error('Unable to load payment methods');
            } finally {
                if (active) setLoadingMethods(false);
            }
        }

        check();

        return () => {
            active = false;
        }
    }, [router]);

    const nextfund = async () => {
        if (open) return;

        try {
            const walletValue = isLocal ? normalize(accountnumber) : normalize(address);
            const accountNameValue = normalize(accountname);
            const bankValue = normalize(bank);

            if (!selectedMethodId || walletValue.length < 3 || (isLocal && (accountNameValue.length < 3 || bankValue.length < 2))) {
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
                return;
            }

            handleOpen();
            await waitForPaint();

            const response = await authFetch('/api/bindwallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    methodId: selectedMethodId,
                    wallet: walletValue,
                    name: isLocal ? accountNameValue : '',
                    bank: isLocal ? bankValue : '',
                })
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
                router.push('/user/account');

            } else {
                toast.error(data.message || 'Unable to bind wallet')
                handleClose();
            }
        } catch (e) {
            console.log(e);
            toast.error('Unable to bind wallet');
            handleClose();
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
                    <Stack direction="column" alignItems="center" justifyContent={"center"} spacing={3} sx={{ background: '#10284D', padding: '16px', borderRadius: '8px', minWidth: "350px", maxWidth: '450px' }}>
                        <Stack direction="row" alignItems="center" justifyContent={"space-between"} sx={{ width: '100%' }}>
                            <p style={{ color: '#D9D8D4', fontWeight: '700', fontSize: '14px' }}>BIND WALLET</p>
                        </Stack>
                        <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '8px', width: '100%', borderRadius: '8px' }}>
                            <p className='normal-bold' style={{ textAlign: 'start' }}>Select Payment Method</p>
                            <FormControl sx={{ m: 1, width: '100%', maxWidth: '301px' }} variant="standard">
                                <NativeSelect
                                    id="demo-customized-select-native"
                                    value={selectedMethodId}
                                    onChange={handleChange}
                                    input={<BootstrapInput />}
                                    disabled={loadingMethods}
                                >
                                    <option value="" style={{ color: '#D9D8D4', background: '#212121' }}>
                                        {loadingMethods ? 'Loading methods...' : 'Select a method'}
                                    </option>
                                    {
                                        paymentMethods.map((w) => {
                                            return (
                                                <option key={w.id ?? w.name} value={w.id} style={{ color: '#D9D8D4', background: '#212121' }}>{String(w.name || '').toUpperCase()}</option>
                                            )
                                        })
                                    }
                                </NativeSelect>
                            </FormControl>
                            {!loadingMethods && paymentMethods.length === 0 && (
                                <p className='normal-bold' style={{ color: '#DE1A1A', textAlign: 'start' }}>No payment methods are available right now.</p>
                            )}
                        </Stack>

                        {
                            isLocal ?
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>Account Number</p>
                                        <input type="text" className="amountinput" placeholder="account number" value={accountnumber} onChange={(e) => {
                                            if (!isNaN(e.target.value)) {
                                                setAccountNumber(e.target.value)
                                            }
                                        }} />
                                    </Stack>

                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>Account Name</p>
                                        <input type="text" className="amountinput" placeholder="account name" value={accountname} onChange={(e) => {

                                            setAccountName(e.target.value)
                                        }} />
                                    </Stack>


                                    {
                                        (curcode === 'idr') ?
                                            <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '8px', width: '100%', borderRadius: '8px' }}>
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
                                            <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '12px', width: '100%', borderRadius: '8px' }}>
                                                <p className='normal-bold' style={{ textAlign: 'start' }}>Input your bank name</p>
                                                <input type="text" className="amountinput" placeholder="bank name" value={bank} onChange={(e) => {

                                                    setBank(e.target.value)
                                                }} />
                                            </Stack>
                                    }

                                </>

                                :
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#06101F', padding: '12px', width: '100%', borderRadius: '8px' }}>
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
