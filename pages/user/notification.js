import {Stack,Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {useRouter} from 'next/router';
export default function Notification() {
    const router = useRouter()
    return(
        <Stack direction="column" sx={{height:'80vh'}}>
            <Stack direction="row"  alignItems='center' sx={{position:'top',top:'0',padding:'8px',background:'#1A1B72'}}>
                <ArrowBackIosNewIcon sx={{color:'white'}} onClick={()=>{
            router.push('/user');
          }}/>

                <Typography sx={{width:'100%',textAlign:'center',color:'#F5F5F5',fontSize: '24px', fontWeight: '800', margin: '4px', fontFamily: 'Poppins, sans-serif' }}>
                    NOTIFICATION
                </Typography>
                 </Stack>
                 
        </Stack>
    )
}