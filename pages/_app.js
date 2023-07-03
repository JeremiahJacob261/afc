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
    <Stack justifyContent="center" alignItems="center" style={{
      overflowX: "hidden", padding: "8px", minHeight: "720px",
      background: "#4054A0"
    }}>
      <SlipContext.Provider value={{ slip, setSlip }}>
        <BetContext.Provider value={{ bets, setBets }}>
          <AppContext.Provider
            value={{ info, setInfo }}
          ><Component {...pageProps} style={{ background: "#4054A0" }} />
            <Footer />
          </AppContext.Provider>
        </BetContext.Provider>
      </SlipContext.Provider>
    </Stack>
  )
}

export default MyApp