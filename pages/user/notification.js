import { Stack, Typography } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../api/supabase';
import Head from 'next/head'
import Image from 'next/image'
import Rd from '../../public/icon/rounds.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
export default function Notification() {
  const router = useRouter();
  const [not, setNot] = useState([]);
  const [info, setInfo] = useState({});
  const isMounted = useRef(true);
  useEffect(() => {
    const useri = localStorage.getItem('signedIns');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUids');
      const name = localStorage.getItem('signNames');
      const ref = localStorage.removeItem('signRef');
      // ...
      if (isMounted.current) {
        console.log(ref)
            const GET = async () => {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', name)
          setInfo(data[0])
          let newref = data[0].newrefer;
        async function GETs() {
          const { data, error } = await supabase
            .from('activa')
            .select()
            .or(`code.eq.${newref},code.eq.broadcast,username.eq.${name}`)
            .order('id', { ascending: false });
          setNot(data);
          console.log(data)
        }
        GETs();
        }
        GET();
    
        isMounted.current = false;
      } else {

      }
    }

  }, []);

  return (
    <Stack direction="column" sx={{ minHeight: '100vh' }}>
      <Head>
        <title>Notifications</title>
        <link rel="icon" href="/brentford.ico" />
      </Head>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ padding: '8px', margin: '2px' }}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px',color:'#cacaca' }} onClick={() => {
          router.push('/user')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#cacaca' }}>Notifications</Typography>
      </Stack>
      <Stack direction="row">
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '500', padding: '8px',color:'#cacaca' }}>Notification ({not.length})</Typography>

      </Stack>
      <Stack direction='column'>
        {
          not.map((r) => {
            console.log(r)
            if (r.type === 'bonus') {
              let date = new Date(r.created_at);
              let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
              return (

                <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                  <Image src={Rd} width={40} height={40} alt='rounds' />
                  <Stack direction='column' sx={{ width: '196px' }}>
                    <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You Recieved Referral Bonus from {r.username} .
                    </Typography>
                    <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                  </Stack>
                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                </Stack>
              );
            } else {
              if (r.username === info.username) {
                let date = new Date(r.created_at);
                let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
                if (r.code === 'bet-cancellation') {
                  return (
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                      <Image src={Rd} width={40} height={40} alt='rounds' />
                      <Stack direction='column' sx={{ width: '196px' }}>
                        <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your Bet of {parseFloat(r.amount).toFixed(3)} USDT was successfully cancelled
                        </Typography>
                      </Stack>
                      <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                    </Stack>
                  )

                } else {
                  if (r.code === 'bet') {
                    return (
                      <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                        <Image src={Rd} width={40} height={40} alt='rounds' />
                        <Stack direction='column' sx={{ width: '196px' }}>
                          <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You Won a bet
                          </Typography>
                          <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                        </Stack>
                        <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                      </Stack>
                    )
                  } else {
                    if (r.code === 'usdtwithdrawsuccess') {
                      return (
                        <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                          <Image src={Rd} width={40} height={40} alt='rounds' />
                          <Stack direction='column' sx={{ width: '196px' }}>
                            <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your USDT Withdrawal Request was Approved.
                            </Typography>
                            <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                          </Stack>
                          <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                        </Stack>
                      )
                    } else {
                      if (r.code === 'gpaywithdrawfailed') {
                        return (
                          <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                            <Image src={Rd} width={40} height={40} alt='rounds' />
                            <Stack direction='column' sx={{ width: '196px' }}>
                              <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your GPAY Withdrawal Request Failed.
                              </Typography>
                              <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                            </Stack>
                            <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                          </Stack>
                        )
                      } else {
                        if (r.code === 'usdtwithdrawfailed') {
                          return (
                            <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                              <Image src={Rd} width={40} height={40} alt='rounds' />
                              <Stack direction='column' sx={{ width: '196px' }}>
                                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your USDT Withdrawal Request Failed.
                                </Typography>
                                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                              </Stack>
                              <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                            </Stack>
                          )
                        } else {
                          if (r.code === 'usdtdepositfailed') {
                            return (
                              <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                                <Image src={Rd} width={40} height={40} alt='rounds' />
                                <Stack direction='column' sx={{ width: '196px' }}>
                                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Your USDT Deposit Claim is not Approved.
                                  </Typography>
                                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                                </Stack>
                                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                              </Stack>
                            )
                          } else {
                            return (
                              <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                                <Image src={Rd} width={40} height={40} alt='rounds' />
                                <Stack direction='column' sx={{ width: '196px' }}>
                                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You Recieved {r.code} from admin
                                  </Typography>
                                  <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{parseFloat(r.amount).toFixed(3)} USDT</Typography>
                                </Stack>
                                <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                              </Stack>
                            )
                          }

                        }

                      }

                    }

                  }
                }

              } else {
                  if(r.code === info.newrefer){
                    let date = new Date(r.created_at);
                    let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
                    return (
    
                      <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                        <Image src={Rd} width={40} height={40} alt='rounds' />
                        <Stack direction='column' sx={{ width: '196px' }}>
                          <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>You have Recieved {parseFloat(parseFloat(r.amount).toFixed(3)).toFixed(3)} USDT from {r.username} as REBATE Commision
                          </Typography>
                        </Stack>
                        <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                      </Stack>
                    );
                  }else{
                    let date = new Date(r.created_at);
                let dates = date.getDate() + '-' + parseInt(date.getMonth() + 1) + '-' + date.getFullYear()
                return (

                  <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '8px' }} key={r.id}>
                    <Image src={Rd} width={40} height={40} alt='rounds' />
                    <Stack direction='column' sx={{ width: '196px' }}>
                      <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>{r.username}
                      </Typography>
                    </Stack>
                    <Typography style={{ color: '#CACACA', fontFamily: 'Poppins,sans-serif', fontSize: '12px', fontWeight: '300' }}>{dates}</Typography>
                  </Stack>
                );
                  }
                


              }

            }

          })
        }
      </Stack>
    </Stack>
  )
}