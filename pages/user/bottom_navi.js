import React,{useContext} from "react"
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { Icon }from '@iconify/react'
import { Paper, Box, Badge } from '@mui/material'
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { useRouter } from 'next/router';
import Profile from '../../public/profile.png';
import Image from 'next/image'
 
function BottomNavi() {
  const [value, setValue] = React.useState(0);
  const router = useRouter()
  const home = () => {
    router.push("/user")
  }
  const matches = () => {
    router.push("/user/matches")
  }
  const me = () => {
    router.push("/user/account")
  }
  const bets = () => {
    router.push("/user/bets")
  }
  return (
    <Box xc='true'>
        <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{background:'#242627',position:'fixed',height:'72px',bottom:0,left:0,width:'100%'}}
      >
        <BottomNavigationAction label={<p style={{ padding:0,margin:0,fontFamily:'Poppins,san-serif',color:'#D9D9D9' }}>Top</p>} onClick={home} icon={<Icon icon="ri:home-line" width="24" height="24"  style={{color: "#D9D9D9"}} />} sx={{width:"40px",color:"E9E5DA"}}/>
        <BottomNavigationAction label={<p style={{ padding:0,margin:0,fontFamily:'Poppins,san-serif',color:'#D9D9D9' }}>Matches</p>} onClick={matches} icon={<Icon icon="ion:football-outline" width="24" height="24"  style={{color: "#D9D9D9"}} />} sx={{width:"40px",color:"E9E5DA"}}/>
        <BottomNavigationAction label={<p style={{ padding:0,margin:0,fontFamily:'Poppins,san-serif',color:'#D9D9D9' }}>My Bets</p>} onClick={bets} icon={
          <Icon icon="mdi:clipboard-text-history-outline" width="24" height="24"  style={{color: "#D9D9D9"}} />
        } sx={{width:"40px",color:"E9E5DA"}}/>
        <BottomNavigationAction label={<p style={{ padding:0,margin:2,fontFamily:'Poppins,san-serif',color:'#D9D9D9' }}>Profile</p>} onClick={me} icon={<Image src={Profile} style={{ width:'26px',height:'26px',padding:0,margin:0}} width="24px" height="24px" alt="profile" />} sx={{width:"40px",color:"E9E5DA"}}/>
      </BottomNavigation>

    </Box>
  )
}
export default BottomNavi;