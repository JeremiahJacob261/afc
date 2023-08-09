import { Divider, Typography, Stack } from "@mui/material";
import TelegramIcon from '@mui/icons-material/Telegram';
import gpay from '../public/simps/gpay.png'
import usdt from '../public/simps/tether.png'
import Image from 'next/image'
export default function Footer() {
    return (
        <div style={{ background: "#1A1B72", width: "100%", padding: "8px",marginTop:'8px',borderTopLeftRadius:'8px',borderTopRightRadius:'8px' }}>
            <Stack direction="column" alignItems="center">
                <div>
                    <Stack direction="row">
                        <Stack direction='column'>
                            <Typography style={{ color: '#3B60E4', fontWeight: '900' ,fontFamily: "Poppins, sans-serif", fontSize: '24px' }}>
                                AFCFIFA
                            </Typography>
                            <Typography  style={{width:'193px', color: '#3B60E4',fontWeight: '100', fontFamily: "Poppins, sans-serif", fontSize: '10px' }}>
                                Afc football investment is licenced by the national futures association
                            </Typography>
                            <Typography style={{ color: '#EE5600', fontWeight: '900' ,fontFamily: "Poppins, sans-serif", fontSize: '24px' }}>
                                +18
                            </Typography>
                            <Typography  style={{width:'193px', color: '#FFE066',fontWeight: '100', fontFamily: "Poppins, sans-serif", fontSize: '10px' }}>
                            Players must be 18 or older to register or play at AFCFIFA. Plase ensure that users follow the company daily release game plan to ensure return of investment fund when the game is lost.
                            
                                           </Typography>
                            <Typography  style={{width:'193px', color: 'white',fontWeight: '400', fontFamily: "Poppins, sans-serif", fontSize: '14px' }}>
                         Payment Methods
                            </Typography>
                            <Stack direction="row" spacing={3}>

                            <Image src={usdt} alt="usdt" width={22} height={20}/>
                            <Image src={gpay} alt='gpay' width={25} height={25}/>
                            </Stack>
                        </Stack>
                        <TelegramIcon sx={{ color: "whitesmoke" }} />
                        <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Quicksand, san-serif" }}>Find US on Telegram</Typography>
                    </Stack>
                </div>
                <div>
                    <Typography variant="subtitle" sx={{ color: "#3B60E4", fontSize: '10px', fontWeight: '100', fontFamily: "Poppins, sans-serif" }}>
                        © 2023 AfcFifa. All rights reserved.
                    </Typography>

                </div>
            </Stack>
        </div>
    )
}