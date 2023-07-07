import { Typography, Stack, Divider, Button, Paper, TextField } from "@mui/material"
import { supabase } from "../../api/supabase"
import {useState,useEffect} from 'react'
import Head from "next/head";
import { useRouter } from "next/router";
export default function Viewbets({bets}){
const [bet,setBet] = useState(bets[0]);
const [league,setLeague] = useState({});

const router = useRouter();
const [info, setInfo] = useState({});
let stams = Date.parse(bet.date + " " + bet.time) / 1000;
let curren = new Date().getTime() / 1000
useEffect(()=>{
    if (localStorage.getItem('me') === null) {
        router.push("/login")
      }else{
      const GET = async () => {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('username', localStorage.getItem('me'))
        setInfo(data[0])
  setBalance(data[0].balance);
      }
      GET();
    }
    const getMatchDa=async()=>{

    const { data, error } = await supabase
    .from('bets')
    .select()
    .eq('match_id',bet.match_id);
    setLeague((data[0].league === 'others') ? data[0].otherl : data[0].league);
    }
    getMatchDa();
},[info]);
const Depositing = async(damount,dusername) => {
    const { data, error } = await supabase
    .rpc('depositor', { amount: damount, names: dusername })
    console.log(error);
  }
    return(
        <div>
             <Head>
        <title>Bet Details</title>
        <meta name="description" content="Login to your Account to see whats up with your bets" />
        <link rel="icon" href="/logo_afc.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
       </Head>
        <Stack direction="column">
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Match Name : {bet.home} vs {bet.away}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>League Name: {league}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Stake : {bet.stake} USDT</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Time : {bet.time}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Date : {bet.date} </Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>%odds : {bet.odd}%</Typography>

<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Market Chosen : {bet.market}</Typography>
<Typography style={{color:'white',fontFamily: 'Poppins, sans-serif'}}>Potential Winnings : {bet.aim} USDT</Typography>
<Stack direction="row" justifyContent="space-between">
    <Typography direction="column" style={{color:'yellow',fontFamily: 'Poppins, sans-serif'}}>Results</Typography>
    
<Typography style={{color:'yellow',fontFamily: 'Poppins, sans-serif',backgroundColor:'#F05D5E',padding:'5px',borderRadius:'8px',margin:'3px'}}>{(stams>curren)?'Not Started':'Processing'}</Typography>
</Stack>
<Button variant='standard' style={{color:'#F05D5E',display:`${(stams>curren)?'visible':'none'}`}} onClick={()=>{
Depositing(bet.stake,info.dusername);
const rem=async()=>{

const { error } = await supabase
  .from('placed')
  .delete()
  .eq('betid', bet.id);
}
rem();
  router.push('/user/bets');
}}>Cancel this bet</Button>
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
