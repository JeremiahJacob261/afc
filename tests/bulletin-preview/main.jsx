import React from 'react'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../locales/en/common.json'
import my from '../../locales/my/common.json'
import Matches from '../../pages/user/matches'
import Bets from '../../pages/user/bets'
import Match from '../../pages/user/match/[id]'
import ViewBet from '../../pages/user/viewbet/[id]'
import { fixture, fixtures } from './fixtures'
import { ThemeProvider } from '@mui/material/styles'
import { customerTheme } from '../../lib/customerTheme'
import '../../styles/globals.css'
import '../../styles/ucl.css'
import 'bootstrap/dist/css/bootstrap.min.css'

const language = location.pathname.includes('/my/') ? 'my' : 'en'
await i18n.use(initReactI18next).init({ lng: language, resources: { en: { common: en }, my: { common: my } }, defaultNS: 'common', interpolation: { escapeValue: false } })
document.documentElement.lang = language
const page = location.pathname.includes('/viewbet/') ? <ViewBet /> : location.pathname.includes('/match/') ? <Match matchDat={[fixture]} /> : location.pathname.endsWith('/bets') ? <Bets /> : <Matches footDat={fixtures} />
createRoot(document.getElementById('root')).render(<ThemeProvider theme={customerTheme}><div style={{background:'var(--ucl-panel)',color:'var(--ucl-blue-accent)',fontSize:12,padding:'8px 16px',textAlign:'center'}}>Local visual review · Synthetic fixtures and bets · Submissions disabled</div>{page}</ThemeProvider>)
