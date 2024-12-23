import { Divider, Typography, Stack } from "@mui/material";
import TelegramIcon from '@mui/icons-material/Telegram';
import gpay from '../public/simps/gpay.png'
import axios from 'axios';
import usdt from '../public/simps/tether.png'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { supabase } from './api/supabase'
export default function Footer() {
    const { locale, locales, push } = useRouter();
//     const HttpProvider = TronWeb.providers.HttpProvider;
// const fullNode = new HttpProvider('https://api.trongrid.io'); 
// const solidityNode = new HttpProvider('https://api.trongrid.io');
// const eventServer = 'https://api.trongrid.io';

// const tronWeb = new TronWeb(
//     fullNode,
//     solidityNode,
//     eventServer
// );
    return (
        <div style={{ background: "#373636",minWidth:'350px', width: "100%", padding: "8px", marginTop: '8px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', marginBottom: "6vh" }}>
            <Stack direction="column" alignItems="center" justifyContent={"space-between"}>
                <div>
                    <Stack direction="row" alignItems="center" justifyContent={"space-between"} spacing={5}>
                        <Stack direction='column' spacing={1}>
                            <Typography style={{ color: '#D4AF37', fontWeight: '900', fontFamily: "Poppins, sans-serif", fontSize: '24px' }}>
                                BFC 
                            </Typography>
                            <Typography style={{ width: '193px', color: '#D4AF37', fontWeight: '100', fontFamily: "Poppins, sans-serif", fontSize: '10px' }}>
                                BFC football investment is licenced by the national futures association
                            </Typography>
                            <Typography style={{ color: '#EE5600', fontWeight: '900', fontFamily: "Poppins, sans-serif", fontSize: '24px' }}>
                                +18
                            </Typography>
                            <Typography style={{ width: '193px', color: '#FFE066', fontWeight: '100', fontFamily: "Poppins, sans-serif", fontSize: '10px' }}>
                                Players must be 18 or older to register or play at BFC . Plase ensure that users follow the company daily release game plan to ensure return of investment fund when the game is lost.

                            </Typography>
                            <Typography style={{ width: '193px', color: '#F5F5F5', fontWeight: '400', fontFamily: "Poppins, sans-serif", fontSize: '14px' }}>
                                Payment Methods
                            </Typography>
                            <Stack direction="row" spacing={3}>

                                <Image src={usdt} alt="usdt" width={22} height={20} />
                            </Stack>
                        </Stack>
                        <Stack direction='column' spacing={1}>
                            <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Poppins, san-serif", fontSize: '11px', fontWeight: '400' }} >General</Typography>
                            <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Poppins, san-serif", fontSize: '11px', fontWeight: '400' }} onClick={() => { push('/', undefined, { locale: 'en' }) }}>English</Typography>
                            <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Poppins, san-serif", fontSize: '11px', fontWeight: '400' }} onClick={() => { push('/', undefined, { locale: 'es' }) }}>Spanish</Typography>
                            <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Poppins, san-serif", fontSize: '11px', fontWeight: '400' }} onClick={() => { push('/', undefined, { locale: 'it' }) }}>Italian</Typography>
                            <Typography variant="subtitle" sx={{ color: "#EEF0F2", fontFamily: "Poppins, san-serif", fontSize: '11px', fontWeight: '400' }} onClick={() => { push('/', undefined, { locale: 'hi' }) }}>Hindi</Typography>
                        </Stack>
                    </Stack>
                </div>
                <div>
                    <Typography variant="subtitle" sx={{ color: "#D4AF37", fontSize: '10px', fontWeight: '100', fontFamily: "Poppins, sans-serif" }}>
                        © 2024 BRADFORD . All rights reserved.
                    </Typography>
                    {/* <Typography onClick={() => {
                        console.log('...started')
                        async function getData() {
                            console.log('...')
                            // const newAccount = await tronWeb.createAccount();
                            // console.log(newAccount);
                            // const trc20ContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT contract address
                            // tronWeb.setAddress('TDZdEAxYkD2z91TBsCpA6wrnjRAg24jJya');
                            // let contract = await tronWeb.contract().at(trc20ContractAddress);
                            // let result = await contract.balanceOf("TDZdEAxYkD2z91TBsCpA6wrnjRAg24jJya").call();
                            // console.log(parseFloat(result));
                        }
                        getData();
                        console.log('done')
                    }}>Tip</Typography> */}
                </div>
            </Stack>
        </div>
    )
}
