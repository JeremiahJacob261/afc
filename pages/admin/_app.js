import '../styles/globals.css'
import {Stack} from '@mui/material'
import {AppContext} from './api/Context'
import {useState} from 'react'
import Cover from './cover'
import Head from 'next/head'
function MyApp({ Component, pageProps }) {
  const [log,setLog] = useState(false)
  return ( 
  <Stack style={{background:"rgb(44, 2, 10)",minHeight:"80vh"}}
  justifyContent="flex-start" alignItems="center"
  >
    <Head>
            <title>DashBoard</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
    <AppContext.Provider value={{log,setLog}}> 
    
      
       <Component {...pageProps} />
   
    </AppContext.Provider>
  
    </Stack>)
  
}
export default MyApp
