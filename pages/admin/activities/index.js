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
import { supabase } from "../api/supabase"
export default function Home({ notification,newrefer }) {
    const noti = notification;
    const router = useRouter();
    const id = router.query.id;
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    function DataShow() {
        if(noti && noti.length > 0){
            return(
                <Stack spacing={2}>
                    {
                         noti.map((item) => {
                            let months = {
                                0:'Jan',
                                1:'Feb',
                                2:'March',
                                3:'April',
                                4:'May',
                                5:'June',
                                6:'July',
                                7:'Aug',
                                8:'Sept',
                                9:'Oct',
                                10:'Nov',
                                11:'Dec'
                            }
                            let date = new Date(item.created_at);
                            let day = date.getDate();
                            let month = months[date.getMonth()];
                            let fullDay = day + '/' + month
                          if (item.code === 'refer') {
                            let infos = {
                                type:'New Refferal',
                                amount:'no payment',
                                time:fullDay,
                                username:item.username,
                                description:`${item.type} +  just signed up with your referral link` ,
                                status:'Success',
                                payment:'...'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                        <Stack>
                            <p><p style={{ fontWeight:'bold',color:'greenyellow'}}>{item.type}</p> has just signed up with your Referral Link on {fullDay}</p>
                        </Stack>
                       
                    </Stack>
                            )
                          } else if(item.code === 'bet-cancellation'){
                            let infos = {
                                type:'bet-cancellation',
                                amount:item.amount,
                                time:fullDay,
                                username:item.username,
                                description:'Bet was cancelled. Contact support if you did not request for this',
                                status:'Success',
                                payment:'USDT(TRC20)'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                        <Stack>
                            <p className='ungradtext' style={{ fontSize: '16px' }}>Your Bet with betid of {item.type} and amount of {item.amount ?? 0} on {fullDay}</p>
                            <p style={{ color: 'white',fontSize:'11px' }}>If you did not Request for this Bet Cancellation, please contact Customer Care</p>
                        </Stack>
                    </Stack>
                            )
                          }else if(item.type === 'bonus' && item.code === ''){
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                        <Stack>
                            <p style={{ fontWeight:'bold',color:'greenyellow'}}>You just recieved a {item.type}</p>
                            <p>{item.amount} USDT</p>
                            <p style={{ color: 'white' }}>{fullDay}</p>
                        </Stack>
                       
                    </Stack>
                            )
                          } else if(item.code === 'usdtdepositsuccess'){
                            let infos = {
                                type:'deposit',
                                amount:item.amount,
                                time:fullDay,
                                username:item.username,
                                description:'Deposit',
                                status:'Success',
                                payment:'USDT(TRC20)'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                <Stack>
                                    <p style={{ fontWeight:'bold',color:'greenyellow'}}>Your USDT Deposit of {item.amount} was Successful on {fullDay}</p>
                                 </Stack>
                            </Stack>
                            )
                          }else if(item.code === 'bet-placed'){
                            let infos = {
                                type:'Bet Placed',
                                amount:item.amount,
                                time:fullDay,
                                username:item.username,
                                description:`Bet Placed Successfully. Match Info: ${item.type}`,
                                status:'Success',
                                payment:'USDT(TRC20)'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                <Stack>
                                    <p style={{ fontWeight:'bold',color:'greenyellow'}}>Your Trade was Successfully for {item.type}, {item.amount} USDT, {fullDay}</p>
                                  </Stack>
                            </Stack>
                            )

                          }else if(item.code === 'usdtdepositfailed'){
                            let infos = {
                                type:'Deposit',
                                amount:item.amount,
                                time:fullDay,
                                username:item.username,
                                description:'USDT Deposit Failed. Contact Customer Care for any Complaints',
                                status:'Failed',
                                payment:'USDT(TRC20)'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                <Stack>
                                    <p style={{ fontWeight:'bold',color:'greenyellow'}}>Your USDT Deposit of {item.amount} USDT Failed on {fullDay}</p>
                                 </Stack>
                            </Stack>
                            )
                          }else{
                           if(item.code === newrefer && item.type === 'depbonus'){
                            let infos = {
                                type:'Broadcast',
                                amount:'',
                                time:fullDay,
                                username:'admin',
                                description:item.username,
                                status:'Success',
                                payment:'none'
                            }
                            return(
                                <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                <Stack>
                                    <p style={{ fontWeight:'bold',color:'greenyellow'}}>You recieved first deposit bonus of {item.amount} USDT from {item.username}</p>
                                    <p style={{ color: 'white' }}>{fullDay}</p>
                                </Stack>
                            </Stack>
                            )
                           }else{
                            if(item.type === 'affbonus' && item.code === newrefer){
                                return(
                                    <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                    <Stack>
                                        <p style={{ fontWeight:'bold',color:'greenyellow'}}>You have recieved rebate bonus of {item.amount} USDT from {item.username}</p>
                                        <p style={{ color: 'white' }}>{fullDay}</p>
                                    </Stack>
                                </Stack>
                                )
                            }else{
                                if(item.code === 'transfersend'){
                                    return(
                                        <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                        <Stack>
                                            <p style={{ fontWeight:'bold',color:'greenyellow'}}>You have sent funds of {item.amount} USDT to {item.type}</p>
                                            <p style={{ color: 'white',fontSize:'11px' }}>If you did not make this E-Transfer, please contact Customer Care as soon as possible.</p>
                                            <p style={{ color: 'white' }}>{fullDay}</p>
                                        </Stack>
                                    </Stack>
                                    )
                                }else if(item.code === 'transfercollect'){
                                    return(
                                        <Stack className='bottomnav' direction='row' key={item.id} justifyContent='space-between' alignItems='center' sx={{ border: '1px solid #981FC0', maxWidth: '90%', minWidth: '80%', borderRadius: '5px' }}>
                                        <Stack>
                                            <p style={{ fontWeight:'bold',color:'greenyellow'}}>You have recieved funds of {item.amount} USDT from {item.type}</p>
                                            <p style={{ color: 'white' }}>{fullDay}</p>
                                        </Stack>
                                    </Stack>
                                    )
                                }else{
                                    return;
                                }
                            }
                           }
                          }
                        })
                    }
                </Stack>
            )
        }else{
            return(
            <Stack justifyContent='center' alignItems='center' sx={{ width:'100%',height:'55vh'}}>
        <p style={{ fontSize:'20px'}}>No Data Avaliable</p>
        <p style={{ color:'grey'}}>Please Check your internet connection</p>
      </Stack>)
        }
    }
    return (
        <div>
              <Icon icon="iconoir:cancel" color="gray" width="100" height="100" onClick={() => {
                    router.push(`/full/${id}`)
                }} />
            <h1 style={{ color:'wheat'}}>Activities</h1>
            <DataShow />
        </div>
    )
}
export async function getServerSideProps(context) {
    let id = context.query.id;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username,newrefer')
            .eq('uid', id);
            console.log(data)
        let username = data[0].username;
        let newrefer = data[0].newrefer;
        const { data: trans, error: transerror } = await supabase
            .from('activa')
            .select('*')
            .or(`username.eq.${username},code.eq.${newrefer}`)
            .order('id', { ascending: false })
        console.log(error)
        if (transerror) {
            console.log(transerror);
        }
        return {
            props: {
                notification: trans,
                newrefer:newrefer
            },
        }
    } catch (e) {
        console.log(e)
        let trans = [];
        return {
            props: {
                notification: trans,
                newrefer:''
            },
        }
    }
}