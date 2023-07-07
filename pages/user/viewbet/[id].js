import { Typography, Stack, Divider, Button, Paper, TextField } from "@mui/material"
import { supabase } from "../../api/supabase"
import {useState,useEffect} from 'react'
export default function Viewbets({bets}){
const [bet,setBet] = useState(bets[0]);
const [league,setLeague] = useState('');
useEffect(()=>{
    const getMatchDa=async()=>{

    const { data, error } = await supabase
    .from('bets')
    .select()
    .eq('match_id',bet.match_id);
    setLeague((data[0].league === 'others') ? data[0].otherl : data[0].league);
    }
    getMatchDa();
},[])
    return(
        <div>
        <Stack direction="column">
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Match Name : {bet.home} vs {bet.away}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>League Name: {league}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Stake : {bet.stake} USDT</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Market Chosen : {bet.market}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Potential Winnings : {bet.aim} USDT</Typography>
<Stack direction="row">
    <Typography direction="column">Status</Typography>
    <Typography>{}</Typography>
</Stack>
<Button variant='outlined' style={{color:'white'}}>Cancel this bet</Button>
        </Stack>
        </div>
    )
}
export async function getStaticPaths() {
    const { data, error } = await supabase
        .from('placed')
        .select()
    const paths = data.map((p) => ({
        params: { id: p.betid },
    }))



    return { paths, fallback: true }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
    // params contains the post `id`.
    // If the route is like /posts/1, then params.id is 1
    const { data, error } = await supabase
        .from('placed')
        .select()
        .eq('betid', params.id)
    let bets = data;

    // Pass post data to the page via props
    return { props: { bets } }
}
