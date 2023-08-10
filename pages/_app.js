import '../styles/globals.css'
import { AppContext, SlipContext } from './api/Context'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCookies } from "react-cookie"
import { Stack } from '@mui/material';
import Footer from './footeras';
import { BetContext } from './api/Context'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies(["user"])
  const [info, setInfo] = useState({ "logged": false, "username": "", "phone": "", "password": "" })
  const [bets, setBets] = useState([])
  const [slip, setSlip] = useState(0)
  return (
    <div style={{background: "#03045E",height:'100%'}}>
      <I18nextProvider i18n={i18n}>
      <Component {...pageProps} style={{ background: "#03045E" ,width:"100%",display:'flex'}} />
      <Footer/>
      </I18nextProvider>
</div>
  )
}

export default MyApp