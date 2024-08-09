import { Stack, Typography, Button } from '@mui/material'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Logos from '../public/logoclean.png'
import afc1 from '../public/simps/AFC.jpg'
import afc2 from '../public/simps/AFC2.jpg'
import afc3 from '../public/simps/AFC3.jpg'
import iv from '../public/simps/Invitation Bonus.jpg'
import kik from '../public/simps/kick.png'
import sal from '../public/simps/Monthly salary.png'
import ref from '../public/simps/Referral Bonus.jpg'
import Link from 'next/link'

import Footer from './footeras';
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { Suspense } from 'react';
export default function Home() {
  const { t } = useTranslation('common')
  const {locale, locales,push} = useRouter()
  const router = useRouter();
  return (
    <div className={styles.container} style={{ background: "#03045E", width: "100%", minHeight: "750px", color: "#242627", opacity: "0.9", padding: "1px", backdropFilter: "blur(8px)" }}>
      <Head>
        <title>Brentford FOOTBALL CLUB (BFC)</title>
        <meta name="description" content="Brentford football club" />
        <link rel="icon" href="/brentford.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="column" justifyContent='center' alignItems="center" spacing={5}>
        <Stack direction="row" style={{ background: '#F5F5F5', width: '100%', height: '64px', padding: '5px' }}
          alignItems='center' justifyContent="space-between">
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Image src={Logos} width={30} height={46} alt='logo' />
            <Typography style={{ fontSize: '13px', fontWeight: '600', color: '#CACACA', margin: '4px', fontFamily: 'Poppins, sans-serif' }}
             onClick={()=>{
              push('/',undefined,{locale:'es'})
            }}>
              BFC01</Typography></div>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Link href='/login' style={{ textDecoration: 'none' }}>
              <Typography style={{ fontSize: '13px', fontWeight: '600', color: '#03045E', margin: '4px', fontFamily: 'Poppins, sans-serif' }}>{t('login')}</Typography></Link>
            <Link href="/register/000208" style={{ textDecoration: 'none' }}>
              <Typography style={{ fontSize: '13px', fontWeight: '600', padding: '8px', borderRadius: '5px', color: '#F5F5F5', margin: '4px', background: '#03045E', fontFamily: 'Poppins, sans-serif' }}>
              {t('registration')}</Typography>

            </Link>
          </div> </Stack>
        <div>
          <Typography style={{ color: '#FFFFFF', fontSize: '24px', margin: '4px', fontWeight: 'bolder', fontFamily: 'Poppins, sans-serif' }}>
          {t('welcome_to')}<br />
            BFC
          </Typography>
          <Typography style={{ width: '308px', height: '111px', fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}>
          {t('site_description')}
          </Typography></div>
        {
          //page
        }
        <div style={{ background: '#1A1B72', padding: '8px', borderRadius: '5px' }}>
          <Image src={iv} width={331} height={157} alt='invitation bonus' />
          <Typography style={{ width: '308px', fontFamily: 'Poppins, sans-serif', fontWeight: 'bold', padding: '8px' }}>{t('invitation_bonus')}</Typography>
          <Typography style={{ width: '308px', height: '185px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
          {t('invitation_bonus_description')}</Typography>
            <Link href="/register/000208" style={{ textDecoration: 'none' }}>
          <Button style={{ border: '1px solid #03045E', color: '#242627' }}>{t('unlock_rewards')}</Button></Link>
        </div>
        {
          //end
        }
        <div style={{ background: '#1A1B72', padding: '8px', borderRadius: '5px' }}>
          <Image src={kik} width={331} height={157} alt='invitation bonus' />
          <Typography style={{ width: '308px', height: '245px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
          {t('betting_markets')}
            </Typography>
            <Link href="/register/000208" style={{ textDecoration: 'none' }}> 
             <Button style={{ fontFamily: 'Poppins, sans-serif', background: '#03045E', color: '#242627', width: '100%' }}>{t('try_our_odds')}</Button>
        </Link>
        </div>
        <Typography style={{ color: '#FFFFFF', fontSize: '20px', margin: '4px', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif', width: '350px' }}>
        {t('earn_on_referrals')}
        </Typography>
        <div style={{ background: '#1A1B72', padding: '8px', borderRadius: '5px' }}>
          <Image src={ref} width={331} height={175} alt='invitation bonus' />
          <div>

            <Typography style={{ fontSize: '15px', width: '308px', height: '55px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
            {t('level_1_bonus')}</Typography>
            <Typography style={{ fontSize: '15px', width: '308px', height: '55px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
            {t('level_2_bonus')}</Typography>
            <Typography style={{ fontSize: '15px', width: '308px', height: '55px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
            {t('level_3_bonus')}</Typography>
          </div>
          <Link href="/register/000208" style={{ textDecoration: 'none' }}>  <Button style={{ fontFamily: 'Poppins, sans-serif', background: '#03045E', color: '#242627', width: '100%' }}>{t('join_now')}</Button>
        </Link>
        </div>
        <Typography style={{ color: '#FFFFFF', textAlign: 'center', fontSize: '15px', margin: '4px', fontWeight: 'normal', fontFamily: 'Poppins, sans-serif', width: '290px' }}>
        {t('earn_from_referrals')}
        </Typography>
        <div style={{ background: '#1A1B72', padding: '8px', borderRadius: '5px' }}>
          <Image src={sal} width={326} height={382} alt='invitation bonus' />
          <Typography style={{ width: '308px', fontSize: '15px', textAlign: 'center', height: '50px', fontFamily: 'Poppins, sans-serif', fontWeight: '300', padding: '2px', margin: '4px' }}>
          {t('build_your_team')}</Typography>
            <Link href="/register/000208" style={{ textDecoration: 'none' }}>  <Button style={{ fontFamily: 'Poppins, sans-serif', background: '#03045E', color: '#242627', width: '100%', padding: '8px' }}>{t('build_team')}</Button>
        </Link>
        </div>
        <Typography style={{ color: '#FFFFFF', textAlign: 'center', fontSize: '24px', margin: '4px', fontWeight: 'bolder', fontFamily: 'Poppins, sans-serif' }}>
        {t('certified')}
        </Typography>
        <Image src={afc1} width={326} height={382} alt='invitation bonus' />
        <Image src={afc2} width={326} height={382} alt='invitation bonus' />
        <Image src={afc3} width={326} height={382} alt='invitation bonus' />
      </Stack>
      <Footer/>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
      ])),
      // Will be passed to the page component as props
    },
  }
}