import BottomNavi from "./bottom_navi"
import { Stack,Typography,Button } from "@mui/material"
import Drawer from '@mui/material/Drawer';
import React,{useState,useEffect} from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from "firebase/auth";
import {BiTimer} from 'react-icons/bi'
import {GiPayMoney,GiReceiveMoney} from 'react-icons/gi'
import TranslateIcon from '@mui/icons-material/Translate';
import {BsFillPersonFill} from 'react-icons/bs'
import {BiSolidContact} from 'react-icons/bi'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { TbMailDollar } from 'react-icons/tb'
import { CgMenuGridR } from 'react-icons/cg'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { app } from '../api/firebase';
import { supabase } from '../api/supabase'
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";
export default function Cover({children}){
    const [draw,setDraw] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const openr = Boolean(anchorEl);
    const [drop, setDrop] = useState(false);
    const auth = getAuth(app)
    const [info, setInfo] = useState({})
    const [trans, setTrans] = useState([])
    const router = useRouter();
    const handleClickr = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleCloser = () => {
      setAnchorEl(null);
    };
    let loads = 0;
    useEffect(() => {
      const useri = localStorage.getItem('signedIn');
      if (useri) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
  
        const uid = localStorage.getItem('signUid');
        const name = localStorage.getItem('signName');
        // ...
        console.log(loads)
          const GETs = async () => {
            try {
              const { data, error } = await supabase
                .from('activa')
                .select()
                .or(`code.eq.${info.newrefer},code.eq.broadcast,username.eq.${info.username}`)
                .limit(10)
                .order('id', { ascending: false });
              setTrans(data)
              console.log(data)
            } catch (e) {
              console.log(e);
            }
  
          }
          GETs();
        
  
      } else {
        // User is signed out
        // ...
        signOut(auth);
        console.log('sign out');
        localStorage.removeItem('signedIn');
        localStorage.removeItem('signUid');
        localStorage.removeItem('signName');
        router.push('/login');
      }
    }, []);
  
    return(
        <Stack direction="column"
        justifyContent="center"
        alignItems="center" style={{width:'100%',background:"#FFFFFF"}}>
            {
        //drawer layout
      }
      <React.Fragment >
      <Drawer
            anchor='left'
            open={draw}
            onClose={()=>{
              setDraw(false)
            }}
          >
          <Stack direction='column' sx={{padding:'12px'}}>
          <Stack  direction='row' alignItems='center' justifyContent='space-between'>
            <Link href="/" style={{ textDecoration: "none" }}>
            <Typography style={{ fontFamily: 'Noto Serif, serif', color: "black", fontWeight: '400', fontSize: '20px' }}>AFCFIFA </Typography>
          </Link>

          </Stack>
          
          <Stack  direction='column'>
            
            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <SportsSoccerIcon sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Matches</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>
          
            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <BiTimer sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Bets</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>

            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <GiPayMoney sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Deposit</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>

            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <GiReceiveMoney sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Withdraw</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>

            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <BsFillPersonFill sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Profile</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>

            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <BiSolidContact sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Contact</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>

            <Stack  direction='row' alignItems='center' justifyContent='space-between' sx={{width:'224px',height:'41px'}}>
            <Stack direction='row' spacing={2}>
              <TranslateIcon sx={{width:'20px',height:'20px'}}/>
            <Typography sx={{fontFamily:'Poppins,sans-serif',fontSize:'14px',fontWeight:'500',color:'black'}}>Language</Typography>
            </Stack>
            <ArrowForwardIosIcon sx={{width:'20px',height:'20px'}}/>
            </Stack>
          </Stack>
          </Stack>
          </Drawer>
      </React.Fragment>
      {
        //drawer layout end
      }
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={openr}
        onClose={handleCloser}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {
          trans.map((r) => {
            if (r.code === 'broadcast') {
              return (

                <MenuItem key={r.id}>
                  <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '4px' }}>
                    <TbMailDollar color="#03045E" />
                    <Typography style={{
                      fontFamily: 'Poppins,sans-serif', fontSize: '10px', fontWeight: 'lighter', overflowX: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical",
                    }}>{r.username}
                    </Typography>
                  </Stack>
                </MenuItem>
              );
            } else {
              if (r.username === info.username) {
                return (
                  <MenuItem key={r.id}>
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '4px' }}>
                      <TbMailDollar color="#03045E" />
                      <Typography style={{ fontFamily: 'Poppins,sans-serif', fontSize: '10px', fontWeight: 'lighter' }}>You Recieved {r.amount} USDT from <br />admin as {r.code}.
                      </Typography>
                    </Stack>
                  </MenuItem>
                )
              } else {


                return (

                  <MenuItem key={r.id}>
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems='center' sx={{ padding: '4px' }}>
                      <TbMailDollar color="#03045E" />
                      <Typography style={{ fontFamily: 'Poppins,sans-serif', fontSize: '10px', fontWeight: 'lighter' }}>You Recieved {r.amount} USDT from <br />{r.username} as Referral Bonus.
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              }
            }

          })
        }
        <Stack justifyContent="center" >

          <Button variant="contained" sx={{ width: '80%', background: '#EE8F00' }} onClick={() => {
            router.push('/user/notification');
          }}>
            <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: '10px', fontWeight: 'lighter', marginLeft: "3px", color: '#03045E' }}>See More</Typography>
          </Button>
        </Stack>
      </Menu>
      {
        //end of menu 
      }
      <Stack direction="row" style={{ background: '#FFFFFF', width: '100%', height: '64px', padding: '5px' }}
        alignItems='center' justifyContent="space-between">
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <CgMenuGridR color="black" style={{ width: '24px', height: '24px' }} onClick={()=>{
            setDraw(true)
          }}/>
        </div>
        <Typography style={{ fontSize: '24px', fontWeight: '800', color: 'black', margin: '4px', fontFamily: 'Noto, serif' }}>AFCFIFA</Typography>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>

          <NotificationsIcon sx={{ color: 'black' }}
            id="basic-button"
            aria-controls={openr ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openr ? 'true' : undefined}
            onClick={handleClickr}
          />
        </div> </Stack>
            <div style={{paddingBottom:"50px"}}>  {children}</div>
          
        <BottomNavi/></Stack>
        
    )
}