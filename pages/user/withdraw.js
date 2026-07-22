import { Button, Stack, TextField, Typography, MenuItem, Divider } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { AppContext } from '@/pages/api/Context'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { app } from '@/pages/api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/router'
import CloseIcon from '@mui/icons-material/Close';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { Icon } from '@iconify/react'
import Head from "next/head";
import Modal from '@mui/material/Modal';
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { useTranslation } from 'next-i18next'
import toast, { Toaster} from 'react-hot-toast'
import Loading from "@/pages/components/loading";
import FormControl from '@mui/material/FormControl';
import { motion } from 'framer-motion'
import { getAuth, signOut } from "firebase/auth";
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import Wig from '@/public/icon/wig.png'
import Image from 'next/image'
import Big from '@/public/icon/badge.png'
import { DriveFileRenameOutlineRounded } from "@mui/icons-material";
import { authFetch, clearLegacyAuthStorage, requireSession } from '@/lib/clientAuth';
import { waitForPaint } from '@/lib/uiFeedback';
import { calculateWithdrawalAmounts } from '@/lib/withdrawalFee';

function isLocalMethod(type) {
  return ['local', 'local-transfer', 'bank', 'mobile-money'].includes(String(type || '').trim().toLowerCase());
}

function translateWithdrawalMessage(message, t, values = {}) {
  const normalized = String(message || '').trim().toLowerCase()

  if (!normalized) return t('messages.unableSubmitWithdrawal')
  if (normalized === 'no transaction pin has been set') return t('mobile.withdraw.noPinSet')
  if (normalized === 'wrong password') return t('mobile.withdraw.wrongPin')
  if (normalized === 'insufficient funds') return t('mobile.withdraw.insufficientFunds')
  if (normalized === 'you have not placed up to 5 bets') return t('mobile.withdraw.betRequirement')
  if (normalized.includes('minimum')) return t('messages.minimumWithdrawal', { amount: values.min ?? values.amount })
  if (normalized.includes('maximum')) return t('mobile.withdraw.maximumWithdrawal', { amount: values.max ?? values.amount })
  if (normalized === 'withdrawal request as been sent') return t('messages.withdrawalSent')

  return message
}

export default function Deposit() {
  const { t } = useTranslation('common')
  const [wallx,setWallx] = useState([]);
  //86f36a9d-c8e8-41cb-a8aa-3bbe7b66d0a5
  function findObjectById(id) {
    return wallx.find(obj => obj.name === id);
  }
  
  const [wallets, setWallet] = useState([]);
  const [info, setInfo] = useState({});
  const [rate,setRate] = useState(1);
  const [currency,setCurrency] = useState('FCFA');
  const [swallet,setSWallet] = useState({});
  const [bank,setBank] = useState('');
  //withdrawal settings
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(6000);
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState(60000);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(7);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [withdrawalDisabledMessage, setWithdrawalDisabledMessage] = useState('Withdrawals are temporarily unavailable. Please try again later.');
  const [withdrawalDisabledDialogOpen, setWithdrawalDisabledDialogOpen] = useState(false);
  //the below controls the loading modal
  const [openx, setOpenx] = useState(false);
  const handleOpenx = () => setOpenx(true);
  const handleClosex = () => setOpenx(false);

  //the end of thellaoding modal control
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(0);
  const [pin, setPin] = useState("");
  const [warnad, setWarnad] = useState("");
  const [warnab, setWarnab] = useState("");
  const [method, setMethod] = useState('');
  const [open, setOpen] = useState(false)
  const auth = getAuth(app);
  const router = useRouter();
  const [ale, setAle] = useState('')
  const [aleT, setAleT] = useState(false)
  //snackbar1
  const [messages, setMessages] = useState("")
  const [opened, setOpened] = useState(false);
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  //serach
  function findObjectByWallet(id) {
    return wallets.find(obj => obj.wallet === id);
  }

  const testRoute = () => {
    const aayncer = async () => {
      try {
          let response = await authFetch('/api/withdraw', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pass: pin,
              wallet: address,
              amount: parseFloat(amount),
              method: currency,
              bank,
              accountname: swallet,
            })
          })
          let test = await response.json();
          console.log(test);
          if (response.status === 401 || response.status === 404) {
            router.push('/login');
            return;
          }
          if (test[0].status === 'Failed') {
            toast.error(translateWithdrawalMessage(test[0].message, t, { min: minWithdrawalAmount, max: maxWithdrawalAmount }));
            handleClosex();
            if (test[0].message === 'No transaction pin has been set') {
              router.push('/user/codesetting')
             
            }
          } else {

            router.push('/user/withdrawsuccess')
            
          }
      } catch (e) {
        console.log(e);
        toast.error(t('messages.unableSubmitWithdrawal'))
        handleClosex();
      }


    }
    aayncer();

  }
  const transaction = async () => {
    if (openx) return

    if (!withdrawalsEnabled) {
      setWithdrawalDisabledDialogOpen(true)
      return
    }

    if (pin === '') {
      toast.error(t('messages.enterTransactionPin'))
    } else if (method === '' || address === '') {
      toast.error(t('messages.chooseWalletFirst'))
    } else if (amount === '') {
      toast.error(t('mobile.withdraw.enterAmount'))
    } else if (Number(amount) < minWithdrawalAmount) {
      toast.error(t('messages.minimumWithdrawal', { amount: minWithdrawalAmount }))
    } else if (Number(amount) > maxWithdrawalAmount) {
      toast.error(t('mobile.withdraw.maximumWithdrawal', { amount: maxWithdrawalAmount }))
    } else if (totalAmount > balance) {
      toast.error(t('mobile.withdraw.insufficientFunds'))

    } else {

      handleOpenx()
      await waitForPaint()
      testRoute();
    }
  }

  useEffect(() => {
    let active = true;

    const GET = async () => {
      const session = await requireSession(router);
      if (!session) return;
      clearLegacyAuthStorage();

      try {
        const response = await authFetch('/api/withdrawal-data');
        if (response.status === 401 || response.status === 404) {
          router.push('/login');
          return;
        }

        const result = await response.json();
        if (!active) return;
        if (!response.ok || result.status !== 'success') {
          throw new Error(result.message || 'Unable to load withdrawal data');
        }

        setWallet(result.wallets ?? []);
        setWallx(result.methods ?? []);
        setInfo(result.profile);
        setBalance(Number(result.profile.balance || 0));

        if (result.settings) {
          setMinWithdrawalAmount(result.settings.minWithdrawalAmount ?? 6000);
          setMaxWithdrawalAmount(result.settings.maxWithdrawalAmount ?? 60000);
          setWithdrawalFeePercent(result.settings.withdrawalFeePercent ?? 7);
          const enabled = result.settings.withdrawalsEnabled ?? true;
          setWithdrawalsEnabled(enabled);
          setWithdrawalDisabledMessage(result.settings.withdrawalDisabledMessage ?? 'Withdrawals are temporarily unavailable. Please try again later.');
          setWithdrawalDisabledDialogOpen(!enabled);
        }
      } catch (e) {
        console.log(e)
        toast.error(t('mobile.withdraw.connectionError'))
      }
    }

    GET();

    return () => {
      active = false;
    }
  }, [router, t]);
  //end of snackbar1

  const Withdrawal = async () => {

  }

  function findUserWalletsById(id) {
    return wallets.find(obj => String(obj.wallid ?? obj.id) === String(id));
  }
  //snackbar2
  const handleClick = () => {
    setOpened(true);
  };

  const handleClosed = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpened(false);
  };
  function Sncks({ message }) {
    return (
      <Snackbar open={opened} autoHideDuration={6000} onClose={handleClosed}>
        <Alert onClose={handleClosed} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    )
  }
  const Alerts = (m, t) => {
    setAle(m)
    setAleT(t)
    setOpen(true)
  }
  //end of snackbar2
  const { requestedAmount, feeAmount, totalAmount } = calculateWithdrawalAmounts(Number(amount || 0), withdrawalFeePercent);
  const fcfa = (value) => `${Math.round(Number(value || 0)).toLocaleString()} FCFA`;
  const currencyCode = String(currency || "FCFA").toUpperCase();
  const showConvertedPayout = currencyCode !== 'FCFA';
  const feePercent = Number(withdrawalFeePercent.toFixed(2));
  return (
    <Cover style={{ minHeight: '95vh', paddingBottom: '100px' }}>
      <Head>
        <title>{t('mobile.withdraw.title')}</title>
        <link rel="icon" href="/european.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Alertz />
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px',color:'white' }} onClick={() => {
          router.push('/user/account')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white' }}>{t('mobile.withdraw.title').toUpperCase()}</Typography>
      </Stack>
      <Stack spacing={3} sx={{ padding: '8px', marginBottom: '100px' }} >
        <Sncks message={messages} />
        <Stack sx={{ minWidth: '350px', minHeight: '110px', background: '#10284D', padding: '8px', borderRadius: '5px' }} direction='column' spacing={2} justifyContent='center'>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('common.currentBalance')}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{fcfa(info.balance)}</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.withdrawalFee')}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{fcfa(feeAmount)} ({feePercent}%)</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.requestedAmount')}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{fcfa(requestedAmount)}</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.youReceive')}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{fcfa(requestedAmount)}</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.totalDeducted')}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{fcfa(totalAmount)}</Typography>
          </Stack>
          {showConvertedPayout && (
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography sx={{ fontSize: '12px', fontWeight: '300', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.youReceiveIn', { currency: currencyCode })}</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{parseFloat(requestedAmount * rate).toFixed(2)} {currencyCode}</Typography>
            </Stack>
          )}
          <Divider sx={{ color: 'white' }} />
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.9 }}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleOpenx()
              router.push('/user/bindwallet')
            }}
          >
              <Stack direction='row' spacing={1} justifyContent='center' alignItems={"center"} sx={{ background: '#06101F', padding: '8px', borderRadius: '8px' }}

            >
              <Icon icon="icon-park-twotone:add" width="24" height="24" style={{ color: '#a3a3a3' }} />

              <Typography sx={{ color: '#E9E5DA', fontSize: '14px', fontWeight: 300, fontFamily: 'Inter,sans-serif' }}>{t('mobile.withdraw.bindWallet')}</Typography>
            </Stack>
          </motion.div>

        </Stack>

        <Stack direction="column" spacing={3}>

          <Stack spacing={1} >
            <Typography sx={{ fontSize: '12px', color: '#06101F', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.chooseWallet')}</Typography>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">{t('mobile.withdraw.selectWithdrawalMethod')}</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={method}
                disabled={!withdrawalsEnabled}
                style={{ background: "#06101F", color: '#E9E5DA', border: '1px solid #E9E5DA' }}
                onChange={(e) => {
                  setMethod(e.target.value);
                  const walletid = findUserWalletsById(e.target.value);

                  if (!walletid) {
                    setAddress('');
                    setSWallet('');
                    setBank('');
                    setRate(1);
                    setCurrency('FCFA');
                    return;
                  }

                  const current = findObjectById(walletid.walletnames);
                  const currentRate = Number(current?.rates);
                  setAddress(walletid.wallet || '');
                  setSWallet(walletid.names || '');
                  setRate(Number.isFinite(currentRate) && currentRate > 0 ? currentRate : 1);
                  setCurrency(current?.currency_code || walletid.walletnames || 'FCFA');
                  setBank(isLocalMethod(walletid.method) ? walletid.bank : (walletid.bank || walletid.walletnames || 'usdt'));
                }}
              >
                <MenuItem value=''>{t('mobile.withdraw.noWallet')}</MenuItem>
                {
                  wallets.map((w) => {
                    const walletValue = w.wallid ?? w.id;
                    return <MenuItem value={walletValue} key={walletValue}>{w.wallet} {w.walletnames ?? w.bank}</MenuItem>
                  })
                }

              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('mobile.withdraw.amountLabel')}</Typography>
            <TextField
              sx={{ border: '1px solid #E9E5DA', input: { color: '#E9E5DA', } }}
              type="number"
              value={amount}
              disabled={!withdrawalsEnabled}
              onChange={(a) => {
                setAmount(a.target.value)

              }} />
          </Stack>
          <Stack spacing={1}>
            <Typography sx={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Poppins,sans-serif', color: '#E9E5DA' }}>{t('forms.transactionPin')}</Typography>
            <TextField
              sx={{ border: '1px solid #E9E5DA', input: { color: '#E9E5DA', }, textAlign: 'center' }}
              type="pin"
              value={pin}
              disabled={!withdrawalsEnabled}
              onChange={(a) => {
                if (!isNaN(a.target.value)) {
                  setPin(a.target.value)
                }
              }} />
          </Stack>


          <motion.div whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            style={{ cursor: withdrawalsEnabled ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: '8px', justifyContent: 'center', color: '#E9E5DA', height: '50px', background: withdrawalsEnabled ? '#1BB6FF' : '#526170', minWidth: '310px', padding: '12px', border: '1px solid #1BB6FF' }}
            onClick={transaction}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') transaction()
            }}
          >{t('mobile.withdraw.submit')}</motion.div>

        </Stack>
      </Stack>
      <Loading open={openx} handleClose={handleClosex} />
      <Modal open={withdrawalDisabledDialogOpen} onClose={() => setWithdrawalDisabledDialogOpen(false)} aria-labelledby="withdrawals-disabled-title">
        <Stack alignItems='center' justifyContent='space-evenly' sx={{ background: '#06101F', width: '290px', minHeight: '250px', borderRadius: '20px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '20px' }}>
          <Typography id="withdrawals-disabled-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#E9E5DA' }}>Withdrawals unavailable</Typography>
          <Typography sx={{ mt: 2, textAlign: 'center', fontSize: '14px', fontWeight: '300', color: '#E9E5DA' }}>{withdrawalDisabledMessage}</Typography>
          <Button variant='contained' sx={{ mt: 3, fontFamily: 'Poppins,sans-serif', color: '#06101F', background: '#1BB6FF', padding: '8px', width: '100%' }} onClick={() => setWithdrawalDisabledDialogOpen(false)}>{t('common.continue')}</Button>
        </Stack>
      </Modal>
      <Toaster position="bottom-center"
        reverseOrder={false} />
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
          background: '#06101F', width: '290px', height: '330px', borderRadius: '20px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '12px'
        }}>
          <Image src={aleT ? Big : Wig} width={120} height={120} alt={aleT ? t('status.success') : t('errors.generic')} />
          <Typography id="modal-modal-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '20px', fontWeight: '500', color: '#E9E5DA' }}>

            {aleT ? t('status.success') : t('errors.generic')}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2, fontSize: '14px', fontWeight: '300', color: '#E9E5DA' }}>
            {ale}
          </Typography>
          <Divider sx={{ background: '#E9E5DA' }} />
          <Button variant='contained' sx={{ fontFamily: 'Poppins,sans-serif', color: '#06101F', background: '#1BB6FF', padding: '8px', width: '100%' }} onClick={() => {
            if (aleT) {
              setOpen(false)
              router.push('/user/withdrawsuccess')
            } else {
              setOpen(false)
            }
          }}>{t('common.continue')}</Button>
        </Stack>

      </Modal>)
  }

}

export async function getStaticProps({ locale }) {
  const i18nProps = await getI18nServerSideProps(locale)
  return {
    props: {
      ...i18nProps,
    },
  }
}
