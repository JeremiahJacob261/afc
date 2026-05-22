import { Stack } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import React,{useRef} from "react";
import { useEffect, useState } from "react";
import LoadingBar from 'react-top-loading-bar'
export default function HomeBottom() {
  const router = useRouter();
  const ref = useRef(null)
  const selectPage = {
      0:'/admin/finances',
      1:'/admin/users',
      2:'/admin/home',
      3:'/admin/match',
      4:'/admin/control'
    }
  const [selected, setSelected] = useState(2);
  const selectLogic = (index) => {
    ref.current.staticStart()
    setSelected(index);
    let page = selectPage[index];
    router.push(page);
    localStorage.setItem("selected", index);
   
  }
  useEffect(() => { 
    let selecteds = localStorage.getItem("selected");
    let page = selectPage[selecteds];
    setSelected(selecteds);
    ref.current.complete()
  }, [selected]);
    return (
        <Stack direction='row' className='bottomnav' sx={{ width:'100vw',position:'fixed',bottom:0}} justifyContent='space-around'>
                 <LoadingBar color='#f11946' ref={ref} height={4}/>
            {/* home start */}
            <motion.div whileTap={{ color:'#f0e7e9'}} >
            <Stack direction='column' alignItems='center' justifyContent='center' sx={{ padding:'8px'}} onClick={()=>{selectLogic(0)}}>
              <Icon icon="mdi:finance" width={24} height={24} className={(selected != 0) ? 'homebtn' : 'homebtnselected'}  />
            <p style={{ fontSize:'14px',fontWeight:'400'}}className={(selected != 0) ? 'homebtn' : 'homebtnselected'}>Finance</p>
            </Stack>
            </motion.div>
            {/* /* home end */}

         {/* event start */}
            <motion.div whileTap={{ color:'#f0e7e9'}}>
         <Stack direction='column' alignItems='center' justifyContent='center' sx={{ padding:'8px'}} onClick={()=>{selectLogic(1)}}>
              <Icon icon="fa:users" width={24} height={24} className={(selected != 1) ? 'homebtn' : 'homebtnselected'} />
            <p style={{ fontSize:'14px',fontWeight:'400'}} className={(selected != 1) ? 'homebtn' : 'homebtnselected'}>Users</p>
            </Stack>
            </motion.div>
            {/* /* event end */}

             {/* search start */}
             <motion.div whileTap={{ color:'red'}}>
         <Stack direction='column' alignItems='center' justifyContent='center' sx={{ padding:'4px'}} onClick={()=>{selectLogic(2)}}>
              <Icon icon="majesticons:home" width={24} height={24} className={(selected != 2) ? 'homebtn' : 'homebtnselected'} />
            <p style={{ fontSize:'14px',fontWeight:'400'}} className={(selected != 2) ? 'homebtn' : 'homebtnselected'}>Home</p>
            </Stack>
            </motion.div>
            {/* /* search end */}

             {/* account start */}
             <motion.div whileTap={{ color:'red'}}>
         <Stack direction='column' alignItems='center' justifyContent='center' sx={{ padding:'8px'}} onClick={()=>{selectLogic(3)}}>
              <Icon icon="mdi:casino-outline" width={24} height={24} className={(selected != 3) ? 'homebtn' : 'homebtnselected'} />
            <p style={{ fontSize:'14px',fontWeight:'400'}} className={(selected != 3) ? 'homebtn' : 'homebtnselected'}>Bets</p>
            </Stack>
            </motion.div>
            {/* /* account end */}

             {/* history start */}
             <motion.div whileTap={{ color:'red'}}>
         <Stack direction='column' alignItems='center' justifyContent='center' sx={{ padding:'8px'}} onClick={()=>{selectLogic(4)}}>
              <Icon icon="ant-design:control-filled" width={24} height={24} className={(selected != 4) ? 'homebtn' : 'homebtnselected'} />
            <p style={{ fontSize:'14px',fontWeight:'400'}} className={(selected != 4) ? 'homebtn' : 'homebtnselected'}>Control</p>
            </Stack>
            </motion.div>
            {/* /* history end */}
        </Stack>
    )
}