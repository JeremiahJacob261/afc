import BottomNavi from "./bottom_navi"
import { Stack } from "@mui/material"
export default function Cover({children}){
    return(
        <Stack direction="column"
        justifyContent="flex-end"
        alignItems="center" style={{maxWidth:"350px",background:"#4054A0"}}>
            <div style={{paddingBottom:"50px"}}>  {children}</div>
          
        <BottomNavi/></Stack>
        
    )
}