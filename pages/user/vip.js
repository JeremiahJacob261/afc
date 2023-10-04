import { Typography } from "@mui/material";
import { useState,useEffect } from "react";
import {supabase} from '../api/supabase'
import { useRouter } from 'next/router'
export default function Vip(){
    
  const [refCount, setRefCount] = useState(0);
  const [viplevel, setViplevel] = useState(1);
  const [usern, setUsern] = useState('')
  const [userR, setUserR] = useState('')
  const router = useRouter()
  const [info, setInfo] = useState([]);
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    const useri = localStorage.getItem('signedIn');
    setUsern(localStorage.getItem('signName'));
    setUserR(localStorage.getItem('signRef'));
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      console.log('...')
      // ...

      const GET = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', localStorage.getItem('signName'))
          setInfo(data[0])
          setBalance(data[0].balance);
          console.log(refCount)
          localStorage.setItem('signRef', data[0].newrefer);
      async function getReferCount() {
        try {
          const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('refer', localStorage.getItem('signRef'))
          setRefCount(count)
          setViplevel((info.totald < 50 && count < 3) ? '1' : (info.totald < 100 && count < 5) ? '2' : (info.totald < 200 && count < 8) ? '3' : (info.totald < 300 && count < 12) ? '4' : (info.totald < 500 && count < 15) ? '5' : (info.totald < 1000 && count < 20) ? '6' : '7');
          console.log(count)
        } catch (e) {
          console.log(e)
        }
      }
      getReferCount();
     } catch (e) {
          console.log(e)
        }

      }
      GET();

    } else {
      // User is signed out
      // ...
      const sOut = async () => {
        const { error } = await supabase.auth.signOut();
        console.log('sign out');
        console.log(error);
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        localStorage.removeItem('signRef');
        router.push('/login');
      }
      sOut();
    }
    console.log(info)
    //  console.log((info.totald < 20) ? '0' : (info.totald < 50) ? '1' : (info.totald < 100) ? '2' : (info.totald < 200) ? '3' : (info.totald < 300) ? '4' : (info.totald < 500) ? '5' : (info.totald < 1000) ? '6' : '7')

  }, [balance]);
    return(
        <div>
            <Typography variant='h4'>VIP {viplevel}</Typography>
        </div>
    )
}