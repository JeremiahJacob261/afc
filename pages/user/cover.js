import BottomNavi from "./bottom_navi"
import { Stack } from "@mui/material"
export default function Cover({children}){
    return(
        <Stack direction="column"
        justifyContent="center"
        alignItems="center" style={{width:'100%',background:"#03045E"}}>
            <div style={{paddingBottom:"50px"}}>  {children}</div>
          
        <BottomNavi/></Stack>
        
    )
}