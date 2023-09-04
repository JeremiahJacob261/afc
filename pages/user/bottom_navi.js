import React,{useContext} from "react"
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EuroIcon from '@mui/icons-material/Euro';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { Paper, Box, Badge } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { useRouter } from 'next/router'
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
        sx={{background:'#E5E7EB',position:'fixed',bottom:0,left:0,width:'100%'}}
      >
        <BottomNavigationAction label="Top" onClick={home} icon={<HomeOutlinedIcon style={{width:"20px"}}/>} sx={{width:"40px",color:"black"}}/>
        <BottomNavigationAction label="Matches" onClick={matches} icon={<SportsSoccerIcon />} sx={{width:"40px",color:"black"}}/>
        <BottomNavigationAction label="My Bets" onClick={bets} icon={
          <ManageAccountsIcon />
        } sx={{width:"40px",color:"black"}}/>
        <BottomNavigationAction label="Profile" onClick={me} icon={<AccountBoxIcon />} sx={{width:"40px",color:"black"}}/>
      </BottomNavigation>

    </Box>
  )
}
export default BottomNavi;