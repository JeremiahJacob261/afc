import React, { useEffect, useState, useRef } from "react"
import leagues from "@/pages/api/leagues.json";
import { Stack, Divider, TextField, Button } from "@mui/material";
import { supabase } from "@/pages/api/supabase"
import Image from 'next/image';
import axios from 'axios';
import Cover from '../cover'
import { Icon } from '@iconify/react';
import Link from "next/link";
import { motion } from 'framer-motion';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from "next/router";
import CancelIcon from '@mui/icons-material/Cancel';
import { Backdrop, CircularProgress } from "@mui/material";
import FormControl from '@mui/material/FormControl';
import { Select as Sel } from '@mui/material';
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
//serversideprops
export async function getServerSideProps(context) {

    const searchParams = context.query;
    try {
        const supabase = getSupabaseAdmin();
        const { data: test, error } = await supabase
            .from('upcoming_matches')
            .select('*')
            .order('id', { ascending: false })
            .limit(250)
        if (error) throw error
        return { props: { final: test,ids:searchParams.id } }

    } catch (e) {
        let test = [];
        return { props: { final: test,ids:searchParams.id } }
    }
    
}
//end serverside props

export default function Select({ final,ids }) {
    console.log(final)
    const [open, setOpen] = useState(false);
    const [finder,setFinder] = useState("");
    const handleClose = () => {
        setOpen(false);
    }
    const [fixturex, setFixturex] = useState(final);
    const [searchValue, setSearchValue] = React.useState('');
    const [remi, setRemi] = useState({});
    const search = async () => {
      try {
          //send data to serverside
          let test = await fetch('/api/admin/matches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: searchValue })
        }).then(data => {
            return data.json();
        })
        setFixturex(test)
        router.push(`/admin/select?id=${searchValue}`);
      } catch (error) {
        console.log(error)
      }
    }
    const router = useRouter();
    const markets = {
        "nilnil": "0 - 0",
        "onenil": "1 - 0",
        "nilone": "0 - 1",
        "oneone": "1 - 1",
        "twonil": "2 - 0",
        "niltwo": "0 - 2",
        "twoone": "2 - 1",
        "onetwo": "1 - 2",
        "twotwo": "2 - 2",
        "threenil": "3 - 0",
        "nilthree": "0 - 3",
        "threeone": "3 - 1",
        "onethree": "1 - 3",
        "twothree": "2 - 3",
        "threetwo": "3 - 2",
        "threethree": "3 - 3",
        "otherscores": "Other"
    }
    const form = useRef();
    function submitForm(event) {
        // Prevent the form from submitting.
        event.preventDefault();
        // Set url for submission and collect data.
        const formData = new FormData(event.target);
        // Build the data object.
        const data = {};
        formData.forEach((value, key) => (data[key] = value));
        // Log the data.
        console.log(data)
        let fData = {
            ...data,
            ...remi
        }
        const upbet = async () => {
           const { data,error } = await supabase
           .from('bets')
           .select('*')
           .eq('match_id',fData.match_id)
           if(data.length > 0 && data){
            alert("bet already uploaded")
           }else{
            const { error } = await supabase
            .from('bets')
            .insert(fData)
            console.log(error)
            if (error === null) {
                alert("bet uploaded")
                setRemi({})
                // router.push("/")
            }
           }
           
        }
        upbet();
    }
    // setRemi({
    //     'match_id': f.id,
    //     'league': f.league,
    //     'time': f.hour + ':' + f.minute,
    //     'date': f.date,
    //     'home': f.home_name,
    //     'away': f.away_name,
    //     'ihome': f.home_logo,
    //     'iaway': f.away_logo
    // })
    useEffect(() => {


    }, []);
    const Fetches = (num) => {
        
    }
const handleOpen = () => {  
                        setOpen(true);
    setInterval(() => {
        setOpen(false);
     }, 3000);
}
    return (
        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1} sx={{ width: '100vw', minHeight: '100vh' }}>
           <Stack justifyContent='center' alignItems='center'>
                <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                >
                       <CancelIcon 
             style={{ width:'50px',height:'50px',color:'white'}}
             onClick={() => {
                router.push("/admin/home")
          }} /> 
                </motion.div>
                </Stack>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
                onClick={handleClose}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Stack direction="column" justifyContent="center" alignItems="center" style={{ width: '100vw', minHeight: '100vh', marginTop: '200px' }}>
          
 
                <Stack direction='row' spacing={1} justifyContent='center' alignItems='center' sx={{ width: '80vw', padding: '8px' }}>
                    <TextField id="standard-basic" label="Users" variant="standard"
                        inputProps={{ style: { color: "white" } }}
                        value={searchValue}
                        onChange={(e) => { setSearchValue(e.target.value); }}
                        sx={{ background: 'rgb(99, 1, 21)', padding: '8px', color: 'white', borderRadius: '8px', letterSpacing: 2, flex: 1 }} />
                    <Icon icon="iconoir:search" color="gray" width="24" height="24" onClick={search} />
                    <Icon icon="mdi:cancel-bold" color="#FCBA04" width="24" height="24" onClick={() => {
                        setFixturex(final)
                        setSearchValue('');
                    }} />
                </Stack>

                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', color: 'white', fontWeight: '400', textAlign: 'center' }}>Number of Games Left Today: {fixturex ? fixturex.length : '0'}</Typography>
                <Stack direction='column-reverse'>

                {
                    fixturex.map((f) => {

                        return (
                            <Stack direction="column" spacing={3} justifyContent='center' alignItems='center'
                                key={f.id}
                                style={{
                                    marginBottom: "8px", padding: "18.5px",
                                    background: '#EFEFEF',
                                    width: '343px',
                                    borderRadius: '5px',
                                    height: 'auto'
                                }} onClick={() => {

                                }}>

                                <form onSubmit={submitForm} ref={form}>
                                    <Stack direction='column'>
                                        <Typography style={{ color: 'black', fontFamily: 'Poppins, sans-serif', fontSize: '12px' }} name='league' >{f.league} </Typography>
                                        <Divider sx={{ background: 'black' }} />
                                    </Stack>
                                    <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                            <Image src={f.home_logo} width={50} height={50} alt='home' name='ihome' />
                                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }} name='home'>{f.home_name}</Typography>
                                        </Stack>
                                        <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }} name='time'>{f.hour}:{f.minute}</Typography>
                                            <p>|</p>
                                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '14px', fontWeight: '100' }} name='date'>{f.day}/{f.month}</Typography>
                                        </Stack>
                                        <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                                            <Image src={f.away_logo} width={50} height={50} alt='away' name='iaway' />
                                            <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'black', fontSize: '12px', fontWeight: '100' }} name='away'>{f.away_name}</Typography>
                                        </Stack>
                                    </Stack>
                                    <Button 
                                        onClick={() => {
                                          router.push(`/admin/input?id=${f.id}`)
                                          localStorage.setItem('prevurl',ids);
                                        }}
                                        sx={{ fontFamily: 'Poppins,sans-serif', margin: '8px', fontSize: '16', fontWeight: '300', color: 'white', background: "#03045E", padding: '10px' }} >
                                        Input ODDS.
                                    </Button>
                                </form>
                            </Stack>
                        )
                    })
                }
                </Stack>
            </Stack>
                   </Stack>
    )
}
