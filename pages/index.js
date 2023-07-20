import { Box, Stack, Typography, Grid, Button, Divider } from '@mui/material'
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
import { useRouter } from 'next/router'
import { getCookies, getCookie, setCookies, removeCookies } from 'cookies-next';
export default function Home() {
  let user = getCookies('logged');

  const router = useRouter()
  if (user.logged === "true") {
    router.push("/user")
  } else {
    console.log("no")
  }
  return (
    <div className={styles.container} style={{ background: "#03045E", width: "100%", minHeight: "750px", color: "white", opacity: "0.9", padding: "1px", backdropFilter: "blur(8px)" }}>
      <Head>
        <title>ATALANTA FOOTBALL CLUB (AFC)</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Stack direction="column" justifyContent='center' alignItems="center">
      <Stack direction="row" style={{background:'#F5F5F5',width:'100%',height:'64px',padding:'5px'}} 
      alignItems='center' justifyContent="space-between">
        <div style={{display:'inline-flex',alignItems:'center'}}>
    <Image src={Logos} width={30} height={46} alt='logo'/>
    <Typography style={{fontSize:'13px',fontWeight:'600',color:'black',margin:'4px',fontFamily: 'Poppins, sans-serif'}}>AFCFIFA</Typography></div>
    <div style={{display:'inline-flex',alignItems:'center'}}>
      <Link href='/login' style={{textDecoration:'none'}}>
    <Typography style={{fontSize:'13px',fontWeight:'600',color:'#03045E',margin:'4px',fontFamily: 'Poppins, sans-serif'}}>Login</Typography></Link>
    <Link href="/register/40985" style={{textDecoration:'none'}}> 
    <Typography style={{fontSize:'13px',fontWeight:'600',padding:'8px',borderRadius:'5px',color:'#F5F5F5',margin:'4px',background:'#03045E',fontFamily: 'Poppins, sans-serif'}}>Registration</Typography>
   
    </Link>
   </div> </Stack>
   <div>
   <Typography style={{color:'#FFFFFF',fontSize:'24px',margin:'4px',fontWeight:'bolder',fontFamily: 'Poppins, sans-serif'}}>
   Welcome to <br/>
   AFCFIFA
   </Typography>
   <Typography style={{width:'308px',height:'111px',fontFamily: 'Poppins, sans-serif',fontWeight:'500'}}>
   The king of cryptocurrency betting sites that combines 
   the excitement of gaming with the security of blockchain technology.
   </Typography></div>
   <div style={{background:'#1A1B72',padding:'8px',borderRadius:'5px'}}>
     <Image src={iv} width={331} height={157} alt='invitation bonus'/>
     <Typography style={{width:'308px',fontFamily: 'Poppins, sans-serif',fontWeight:'bold',padding:'8px'}}>Unlimited Invitation Bonus</Typography>
    <Typography style={{width:'308px',height:'151px',fontFamily: 'Poppins, sans-serif',fontWeight:'300',padding:'2px',margin:'4px'}}>
      Get rewarded for sharing the love! Introduce your friends to AFCFIFA and receive exclusive bonuses for you and your referred friends.
       Start spreading the word and unlock exciting rewards today!</Typography>
      <Button style={{border:'1px solid #03045E'}}>Unlock Rewards</Button>
   </div>
      </Stack>
    </div>
  )
}
