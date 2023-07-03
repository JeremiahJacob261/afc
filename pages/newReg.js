import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {supabase} from './api/supabase'

export default function VerticalLinearStepper() {
  

  return (
    <Box sx={{ maxWidth: 400 }}>
    <Button onClick={()=>{
      const trys=async()=>{
          const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('username','Godlike')
      console.log(count)
      console.log(error)
      }
    trys()
    }}>Try</Button>
    </Box>
  );
}