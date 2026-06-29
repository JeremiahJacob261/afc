import '@/styles/globals.css'
import '@/styles/bind.css';
import { AppContext, SlipContext } from '@/pages/api/Context'
import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCookies } from "react-cookie"
import { Stack } from '@mui/material';
import Head from 'next/head'
import Footer from './footeras';
import { BetContext } from '@/pages/api/Context'
import { useRouter } from 'next/router'
import AdminShell from '@/components/admin/AdminShell'
import AppLoadingOverlay from '@/components/AppLoadingOverlay'
function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies(["user"])
  const [info, setInfo] = useState({ "logged": false, "username": "", "phone": "", "password": "" })
  const [bets, setBets] = useState([])
  const [slip, setSlip] = useState(0)
  const [routeLoading, setRouteLoading] = useState(false)
  const router = useRouter()
  const shouldUseAdminShell = router.pathname.startsWith('/admin') && router.pathname !== '/admin'

  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) setRouteLoading(true)
    }
    const handleStop = () => setRouteLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleStop)
    router.events.on('routeChangeError', handleStop)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const isSecureContext = window.location.protocol === 'https:' || isLocalhost

    if (!isSecureContext) return

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => registration.update())
        .catch((error) => {
          console.error('Service worker registration failed:', error)
        })
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }

    return () => window.removeEventListener('load', registerServiceWorker)
  }, [])

  return (
    <div style={{background: "#06101F",height:'100%'}}>
      <Head>
        <title>EFC</title>
        <meta name="description" content="Login to your Account to see whats up with your investments
        " />
        <meta name="application-name" content="EFC" />
        <meta name="apple-mobile-web-app-title" content="EFC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#06101F" />
        <meta name="msapplication-TileColor" content="#06101F" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/european.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {shouldUseAdminShell ? (
        <AdminShell>
          <Component {...pageProps} style={{ background: "#06101F" ,width:"100%",display:'flex'}} />
        </AdminShell>
      ) : (
        <Component {...pageProps} style={{ background: "#06101F" ,width:"100%",display:'flex'}} />
      )}
      <AppLoadingOverlay open={routeLoading} title="" message="" />
      
</div>
  )
}

export default MyApp
