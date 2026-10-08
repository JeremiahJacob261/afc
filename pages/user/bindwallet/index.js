import { translateApiMessage } from '@/lib/translateApiMessage'
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
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';
import { useTranslation } from 'next-i18next';


function normalize(value) {
    return String(value || '').trim();
}

function isLocalMethod(type) {
    return ['local', 'local-transfer', 'bank', 'mobile-money'].includes(normalize(type).toLowerCase());
}

export default function Home() {
    const { t } = useTranslation('common');
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
                toast.error(t('messages.unableLoadPaymentData'));
            } finally {
                if (active) setLoadingMethods(false);
            }
        }

        check();

        return () => {
            active = false;
        }
    }, [router, t]);

    const nextfund = async () => {
        if (open) return;

        try {
            const walletValue = isLocal ? normalize(accountnumber) : normalize(address);
            const accountNameValue = normalize(accountname);
            const bankValue = normalize(bank);

            if (!selectedMethodId || walletValue.length < 3 || (isLocal && (accountNameValue.length < 3 || bankValue.length < 2))) {
                toast(t('messages.walletDetailsInvalid'),
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
                toast(t('messages.walletBindSuccess'),
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
                toast.error(translateApiMessage(data, t, 'messages.unableBindWallet'))
                handleClose();
            }
        } catch (e) {
            console.log(e);
            toast.error(t('messages.unableBindWallet'));
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
            backgroundColor: '#f1f3ee',
            color: '#52685d',
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
                <title>{t('mobile.profile.bindWallet')}</title>
            </Head>
            <Loading open={open} handleClose={handleClose} />
            <Stack direction="column" spacing={3} justifyContent="center" alignItems="center" sx={{ minWidth: 0, width: '100%', height: '100%' }} >

                <Stack direction="column" alignItems="center" justifyContent={"center"} sx={{ marginTop: '20px', marginBottom: "20px", background: 'none', minWidth: 0, paddingBottom: '30px', width: '100%', maxWidth: '450px' }}>
                    <Stack direction="column" alignItems="stretch" justifyContent={"center"} spacing={3} sx={{ background: '#ffffff', padding: { xs: '16px', sm: '32px' }, border: '1px solid #dfe5df', borderRadius: '16px', minWidth: 0, width: '100%', maxWidth: '450px' }}>
                        <Stack direction="row" alignItems="center" justifyContent={"space-between"} sx={{ width: '100%' }}>
                            <h1 style={{ color: '#080f32', fontFamily: 'Georgia,serif', fontWeight: 400, fontSize: '32px', margin: 0 }}>{t('mobile.profile.bindWallet')}</h1>
                        </Stack>
                        <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '8px', width: '100%', borderRadius: '8px' }}>
                            <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.chooseMethod')}</p>
                            <FormControl sx={{ width: '100%' }} variant="standard">
                                <NativeSelect
                                    id="demo-customized-select-native"
                                    value={selectedMethodId}
                                    onChange={handleChange}
                                    input={<BootstrapInput />}
                                    disabled={loadingMethods}
                                >
                                    <option value="" style={{ color: '#52685d', background: '#f1f3ee' }}>
                                        {loadingMethods ? t('mobile.wallet.loading') : t('forms.chooseMethod')}
                                    </option>
                                    {
                                        paymentMethods.map((w) => {
                                            return (
                                                <option key={w.id ?? w.name} value={w.id} style={{ color: '#52685d', background: '#f1f3ee' }}>{String(w.name || '').toUpperCase()}</option>
                                            )
                                        })
                                    }
                                </NativeSelect>
                            </FormControl>
                            {!loadingMethods && paymentMethods.length === 0 && (
                                <p className='normal-bold' style={{ color: '#DE1A1A', textAlign: 'start' }}>{t('emptyStates.noData')}</p>
                            )}
                        </Stack>

                        {
                            isLocal ?
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.accountNumber')}</p>
                                        <input type="text" className="amountinput" placeholder={t('forms.accountNumber')} value={accountnumber} onChange={(e) => {
                                            if (!isNaN(e.target.value)) {
                                                setAccountNumber(e.target.value)
                                            }
                                        }} />
                                    </Stack>

                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.accountName')}</p>
                                        <input type="text" className="amountinput" placeholder={t('forms.accountName')} value={accountname} onChange={(e) => {

                                            setAccountName(e.target.value)
                                        }} />
                                    </Stack>


                                    {
                                        (curcode === 'idr') ?
                                            <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '8px', width: '100%', borderRadius: '8px' }}>
                                                <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.bank')}</p>
                                                <FormControl sx={{ width: '100%' }} variant="standard">
                                                    <NativeSelect
                                                        id="demo-customized-select-native"
                                                        value={bank}
                                                        onChange={handleBhange}
                                                        input={<BootstrapInput />}
                                                    >
                                                        <option aria-label={t('mobile.withdraw.noWallet')} value="" style={{ color: '#52685d', background: '#f1f3ee' }} />
                                                        {
                                                            IDRBANK.map((w) => {
                                                                return (
                                                                    <option key={w.name} value={w.name} style={{ color: '#52685d', background: '#f1f3ee' }}>{w.name.toUpperCase()}</option>
                                                                )
                                                            })
                                                        }
                                                    </NativeSelect>
                                                </FormControl>
                                            </Stack>
                                            :
                                            <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '12px', width: '100%', borderRadius: '8px' }}>
                                                <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.bankName')}</p>
                                                <input type="text" className="amountinput" placeholder={t('forms.bankName')} value={bank} onChange={(e) => {

                                                    setBank(e.target.value)
                                                }} />
                                            </Stack>
                                    }

                                </>

                                :
                                <>
                                    <Stack direction="column" alignItems="start" justifyContent={"center"} spacing={0} sx={{ background: '#fdfcf8', padding: '12px', width: '100%', borderRadius: '8px' }}>
                                        <p className='normal-bold' style={{ textAlign: 'start' }}>{t('forms.walletAddress')}</p>
                                        <input type="text" className="amountinput" placeholder={t('forms.walletAddress')} value={address} onChange={(e) => {

                                            setAddress(e.target.value)
                                        }} />
                                    </Stack>


                                </>

                        }

                        <button type="button" className="powerbtn" onClick={nextfund}>{t('mobile.profile.bindWallet')}</button>
                    </Stack>
                    <button type="button" onClick={() => router.back()} style={{ fontSize: '16px', fontWeight: 700, color: '#0649ff', textAlign: 'center', width: '100%', minHeight: '44px', padding: '8px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 0 }}>{t('common.back')}</button>

                </Stack>


            </Stack>
        </Cover>
    )
}

export async function getServerSideProps(context) {
    const i18nProps = await getI18nServerSideProps(context.locale)
    return {
        props: {
            ...i18nProps,
        },
    }
}
