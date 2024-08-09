import '../styles/globals.css'
import '@/styles/bind.css';
import { AppContext, SlipContext } from './api/Context'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCookies } from "react-cookie"
import { Stack } from '@mui/material';
import Footer from './footeras';
import { BetContext } from './api/Context'
import { appWithTranslation } from 'next-i18next'
function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies(["user"])
  const [info, setInfo] = useState({ "logged": false, "username": "", "phone": "", "password": "" })
  const [bets, setBets] = useState([])
  const [slip, setSlip] = useState(0)
  return (
    <div style={{background: "#242627",height:'100%'}}>
      <Component {...pageProps} style={{ background: "#242627" ,width:"100%",display:'flex'}} />
      
</div>
  )
}

export default appWithTranslation(MyApp)