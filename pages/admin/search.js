import { Button } from "@mui/material"
import { supabase } from "./api/supabase"
export default function Search(){
    return(
        <div>
            <Button onClick={()=>{
                const cu=async()=>{
                    const { data, error } = await supabase
                    .from('useractivity')
                    .insert({
                        type:'deposit',amount:100,
                        user:'bellos',
                        count:0
                    })
                    console.log(error)
                }
                cu()
            }}>Try</Button>
        </div>
    )
}