import '../styles/globals.css'
import { AppContext, SlipContext } from './api/Context'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCookies } from "react-cookie"
import { Stack } from '@mui/material';
import Footer from './footeras';
import { BetContext } from './api/Context'
function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies(["user"])
  const [info, setInfo] = useState({ "logged": false, "username": "", "phone": "", "password": "" })
  const [bets, setBets] = useState([])
  const [slip, setSlip] = useState(0)
  return (
    <div style={{background: "#03045E"}}>
      <Component {...pageProps} style={{ background: "#03045E" ,width:"100%",display:'flex'}} />
      <Footer/>
    </div>
  )
}

export default MyApp