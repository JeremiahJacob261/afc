import {Paper, Stack, Typography} from '@mui/material'
import { useEffect, useState } from 'react'
import {supabase} from './api/supabase'
export default function Referral({refs}) {

    return(
        <Stack style={{width:"350px"}} justifyContent="center" direction="column" alignItems="center" spacing={3}>
          <Typography variant="h5" sx={{padding:"8px",color:"white"}}>List Of all Invite Codes and Referral</Typography>
            {
               refs.map((d)=>{
                return(
                     <Paper sx={{padding:"8px"}} key={d.refer}><Stack direction="column" alignItems="center" justifyContent="center" >
                        <Typography sx={{color:"black"}}>Invite Code:{d.refer}</Typography>
                        <Typography>Number Of Referral:{d.count}</Typography>
                </Stack></Paper>)
                })
            }</Stack>
    )
}
export async function getServerSideProps(context) {
  const {data,error} = await supabase
  .from('referral')
  .select()
  const refs = data;
 
  return {
    props: {refs}, // will be passed to the page component as props
  }
}
