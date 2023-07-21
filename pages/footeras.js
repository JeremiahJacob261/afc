import { Divider, Typography,Stack } from "@mui/material";
import TelegramIcon from '@mui/icons-material/Telegram';
export default function Footer(){
    return(
        <div style={{background:"none",width:"100%",padding:"8px"}}>
            <Divider sx={{background:"whitesmoke"}}/>
            <Stack direction="column" alignItems="center">
        <Typography sx={{color:"#EEF0F2",fontFamily:"Nerko One, cursive",fontSize:"20px"}}>ATALANTA INVESTMENT BET</Typography>
        <Stack direction="row">
        <TelegramIcon sx={{color:"whitesmoke"}}/> 
        <Typography variant="subtitle" sx={{color:"#EEF0F2",fontFamily:"Quicksand, san-serif"}}>Find US on Telegram</Typography>
       </Stack>
        <Typography variant="subtitle" sx={{color:"#EEF0F2",fontFamily:"Quicksand, san-serif"}}>CopyRights 2022 @ afcfifa.com</Typography>
        <Typography variant="subtitle" sx={{color:"#EEF0F2",fontFamily:"Quicksand, san-serif"}}>Privacy</Typography>
        <Typography variant="subtitle" sx={{color:"#EEF0F2",fontFamily:"Quicksand, san-serif"}}>Terms and Conditions</Typography>
            </Stack>
        </div>
    )
}