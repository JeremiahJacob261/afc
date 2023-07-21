import React,{useContext} from "react"
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
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
      <Paper elevation={5} sx={{ borderRadius: "10px", border: "0.5px solid black", position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{ borderRadius: "10px" ,background:'#1A1B72'}}
      >
        <BottomNavigationAction label="Top" onClick={home} icon={<HomeIcon style={{width:"20px"}}/>} sx={{width:"40px",color:"white"}}/>
        <BottomNavigationAction label="Matches" onClick={matches} icon={<SportsSoccerIcon />} sx={{width:"40px",color:"white"}}/>
        <BottomNavigationAction label="My Bets" onClick={bets} icon={
          <ManageAccountsIcon />
        } sx={{width:"40px",color:"white"}}/>
        <BottomNavigationAction label="Profile" onClick={me} icon={<AccountBoxIcon />} sx={{width:"40px",color:"white"}}/>
      </BottomNavigation></Paper>

    </Box>
  )
}
export default BottomNavi;