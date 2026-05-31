import React, { useContext } from "react"
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { Icon } from '@iconify/react'
import { Paper, Box, Badge } from '@mui/material'
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { useRouter } from 'next/router';
import Profile from '@/public/profile.png';
import Image from 'next/image'
import Loading from '@/pages/components/loading';


function BottomNavi() {
  const [value, setValue] = React.useState(0);
  //the below controls the loading modal
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const router = useRouter()
  const isBetsPage = router.pathname == '/dashboard/bets'
  const home = () => {
    if (router.pathname == '/dashboard') {
      handleOpen()
      window.location.reload()
    } else {
      handleOpen()
      router.push("/dashboard")

    }

  }
  const matches = () => {
    if (router.pathname == '/dashboard/matches') {
      handleOpen()
      window.location.reload()
    } else {
      handleOpen()
      router.push("/dashboard/matches")
    }
  }
  const me = () => {
    if (router.pathname == '/dashboard/account') {
      handleOpen()
      window.location.reload()
    } else {
      handleOpen()
      router.push("/dashboard/account")
    }
  }
  const bets = () => {
    if (router.pathname == '/dashboard/bets') {
      handleOpen()
      window.location.reload()
    } else {
      handleOpen()
      router.push("/dashboard/bets")
    }
  }


  return (
    <Box xc='true'>
      <Loading open={open} handleClose={handleClose} />
      <BottomNavigation
        className={isBetsPage ? 'bottom-nav' : 'dark-glass bottom-nav'}
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{ background: isBetsPage ? '#06101F' : 'rgba(6, 16, 31, 0.96)', position: 'fixed', minHeight: '72px', height: 'calc(72px + env(safe-area-inset-bottom))', bottom: 0, left: 0, width: '100%', zIndex: (theme) => theme.zIndex.drawer + 3, borderTop: isBetsPage ? '1px solid #1D3658' : 'none', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', px: 1, pb: 'env(safe-area-inset-bottom)' }}
      >
        <BottomNavigationAction label={<p style={{ padding: 0, margin: 0, fontFamily: 'Poppins,san-serif', color: '#D9D9D9' }}>Top</p>} onClick={home} icon={<Icon icon="ri:home-line" width="24" height="24" style={{ color: "#D9D9D9" }} />} sx={{ width: "40px", color: "E9E5DA" }} />
        <BottomNavigationAction label={<p style={{ padding: 0, margin: 0, fontFamily: 'Poppins,san-serif', color: '#D9D9D9' }}>Matches</p>} onClick={matches} icon={<Icon icon="ion:football-outline" width="24" height="24" style={{ color: "#D9D9D9" }} />} sx={{ width: "40px", color: "E9E5DA" }} />
        <BottomNavigationAction label={<p style={{ padding: 0, margin: 0, fontFamily: 'Poppins,san-serif', color: '#D9D9D9' }}>My Bets</p>} onClick={bets} icon={
          <Icon icon="mdi:clipboard-text-history-outline" width="24" height="24" style={{ color: "#D9D9D9" }} />
        } sx={{ width: "40px", color: "E9E5DA" }} />
        <BottomNavigationAction label={<p style={{ padding: 0, margin: 2, fontFamily: 'Poppins,san-serif', color: '#D9D9D9' }}>Profile</p>} onClick={me} icon={<Image src={Profile} style={{ width: '26px', height: '26px', padding: 0, margin: 0 }} width="24px" height="24px" alt="profile" />} sx={{ width: "40px", color: "E9E5DA" }} />
      </BottomNavigation>

    </Box>
  )
}
export default BottomNavi;
