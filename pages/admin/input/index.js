import { supabase } from "@/pages/api/supabase";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { Button } from '@mui/material';
import { useRef } from 'react';
import { TextField } from '@mui/material';
import { Checkbox } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { FormControl } from '@mui/material';
import { InputLabel } from '@mui/material';
import { Select, MenuItem } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getMatchStartMs, useClientMatchDisplay } from '@/lib/matchDisplay';
export default function Input({ datas }) {
    const [drop, setDrop] = useState(false);
    let f = datas;
    const fixtureDisplay = useClientMatchDisplay(f);
    const fixtureStartMs = getMatchStartMs(f);
    const [checked, setCheck] = useState(false);
    const [company, setCompany] = useState('');
    const router = useRouter();
    const [remi, setRemi] = useState({});
    // Date-time string
    function formatDate(inputDate) {
        const [year, month, day] = inputDate.split('-').map(Number);

        // Ensure month and day are two digits
        const formattedMonth = ('0' + month).slice(-2);
        const formattedDay = ('0' + day).slice(-2);

        return `${year}-${(month > 9) ? month : formattedMonth}-${(day > 9) ? day : formattedDay}`;
    }
    console.log(datas)


    const mapmarkets = [
        { "name": "nilnil", "count": "0 - 0" },
        { "name": "onenil", "count": "1 - 0" },
        { "name": "nilone", "count": "0 - 1" },
        { "name": "oneone", "count": "1 - 1" },
        { "name": "twonil", "count": "2 - 0" },
        { "name": "niltwo", "count": "0 - 2" },
        { "name": "twoone", "count": "2 - 1" },
        { "name": "onetwo", "count": "1 - 2" },
        { "name": "twotwo", "count": "2 - 2" },
        { "name": "threenil", "count": "3 - 0" },
        { "name": "nilthree", "count": "0 - 3" },
        { "name": "threeone", "count": "3 - 1" },
        { "name": "onethree", "count": "1 - 3" },
        { "name": "twothree", "count": "2 - 3" },
        { "name": "threetwo", "count": "3 - 2" },
        { "name": "threethree", "count": "3 - 3" },
        { "name": "otherscores", "count": "Other" }
    ];

    const form = useRef();
    function submitForm(event) {
        setDrop(true)
        // Prevent the form from submitting.
        event.preventDefault();
        if (checked && !company) {
            alert('Please select the protected company market')
            setDrop(false)
            return
        }
        // Set url for submission and collect data.
        const formData = new FormData(event.target);
        // Build the data object.
        const data = {};
        formData.forEach((value, key) => (data[key] = value));
        // Log the data.
        console.log(data)
        let comms = {
            "company": checked,
            "comarket": company,
            "tsgmt": fixtureStartMs
        }
        let fData = {
            ...data,
            ...remi,
            ...comms,
        }
        console.log(fData)
        const upbet = async () => {
            const { data, error } = await supabase
                .from('bets')
                .select('*')
                .eq('match_id', fData.match_id)
            if (data.length > 0 && data) {
                alert("bet already uploaded, please check your bets to edit")
            } else {
                const sendData = async () => {
                    console.log(fData.date);

                    
                    try {
                        const { error } = await supabase
                                .from('bets')
                                .insert({...fData })
                       alert("bet uploaded")
                       console.log(error)
                    } catch (e) {
                        console.log(e);
                    }
                }
                sendData().then(()=>{
                    setDrop(false)
                })
                // const { error } = await supabase
                //     .from('bets')
                //     .insert(fData)
                // console.log(error)
                // if (error === null) {
                //     alert("bet uploaded")
                //     setRemi({})
                //     // router.push("/")
                // }
            }

        }
        upbet();
    }
    return (
        <Stack direction='column' spacing={2} sx={{ marginBottom: '120px', padding: '12px' }}>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={drop}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
            <Stack justifyContent='center' alignItems='center'>
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <CancelIcon
                        style={{ width: '50px', height: '50px', color: 'white' }}
                        onClick={() => {
                            router.push("/admin/select?id=1")
                        }} />
                </motion.div>
            </Stack>
            <Stack direction='row' justifyContent='center' alignItems='center' spacing={3}>
                <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={f.home_logo} width={50} height={50} alt='home' name='ihome' style={{ objectFit: 'contain' }} unoptimized />
                    <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'whitesmoke', fontSize: '12px', fontWeight: '100' }} name='home'>{f.home_name}</Typography>
                </Stack>
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
                    <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'whitesmoke', fontSize: '14px', fontWeight: '100' }} name='time'>{fixtureDisplay.time}</Typography>
                    <p>|</p>
                    <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'whitesmoke', fontSize: '14px', fontWeight: '100' }} name='date'>{fixtureDisplay.date}</Typography>
                </Stack>
                <Stack direction='column' justifyContent='center' alignItems='center' spacing={1}>
                    <Image src={f.away_logo} width={50} height={50} alt='away' name='iaway' style={{ objectFit: 'contain' }} unoptimized />
                    <Typography sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', color: 'whitesmoke', fontSize: '12px', fontWeight: '100' }} name='away'>{f.away_name}</Typography>
                </Stack>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">

                <Checkbox
                    checked={checked}
                    onChange={(e) => {
                        setCheck(e.target.checked)
                    }}
                    sx={{ color: "white" }}
                    inputProps={{ 'aria-label': 'controlled' }} />
                <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '300' }}>Is this a company game</p>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ display: checked ? 'visible' : 'none' }}>
                <p>Company Market</p>
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Company</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={company}
                        label="Company"
                        onChange={(e) => {
                            setCompany(e.target.value)
                            console.log(e.target.value)
                        }}
                        sx={{ background: 'whitesmoke', color: "black" }}
                    >
                        {
                            mapmarkets.map((m) => {
                                return (
                                    <MenuItem value={m.name} key={m.name}>{m.count}</MenuItem>
                                )
                            })
                        }

                    </Select>
                </FormControl>
            </Stack>
            <form onSubmit={submitForm} ref={form}>
                <Stack spacing={2}>
                    {
                        //get odds
                    }
                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-0</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="nilnil" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>otherscores</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="otherscores" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-0</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="onenil" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-1</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="oneone" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-1</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="nilone" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-1</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="twoone" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-2</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="twotwo" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-2</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="onetwo" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-0</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="twonil" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-2</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="niltwo" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-1</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="threeone" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>1-3</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="onethree" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-0</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="threenil" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>0-3</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="nilthree" />
                        </Stack>
                    </Stack>

                    <Stack direction='row' spacing={2} justifyContent='space-between' sx={{ width: '100%' }}>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-2</Typography>
                            <TextField variant='standard' type='float' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="threetwo" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>3-3</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="threethree" />
                        </Stack>
                        <Stack direction='row' justifyContent='space-around' alignItems='center' sx={{ borderRadius: '5px', width: '96px', height: '40px', background: '#E6E8F3' }}>
                            <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black' }}>2-3</Typography>
                            <TextField variant='standard' sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '400', color: 'black', width: '50px', height: '30px' }} name="twothree" />
                        </Stack>
                    </Stack>
                    {
                        //end of oods
                    }
                </Stack>
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={2} sx={{ margin: '8px' }}>
                    <Button variant='contained' type='submit' sx={{ width: '300px', height: '40px', color: '#E6E8F3', background: 'black', borderRadius: '5px' }} onClick={() => {
                        setRemi({
                            'match_id': f.id,
                            'league': f.league,
                            'time': f.hour + ':' + f.minute,
                            'date': formatDate(f.date) + ' ' + f.hour + ':' + f.minute + ':00',
                            'home': f.home_name,
                            'away': f.away_name,
                            'ihome': f.home_logo,
                            'iaway': f.away_logo
                        })
                    }}>Submit</Button>
                </Stack>
            </form>
        </Stack>
    )
}
export async function getServerSideProps(context) {
    try {
        requireAdmin(context.req);
        let id = context.query.id;
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('upcoming_matches')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            props: {
                datas: data
            },
        }
    } catch (error) {
        if (error.statusCode === 401) {
            const nextPath = context.resolvedUrl || '/admin/input';
            return {
                redirect: {
                    destination: `/admin?next=${encodeURIComponent(nextPath)}`,
                    permanent: false,
                },
            }
        }

        return {
            notFound: true,
        }
    }
}
