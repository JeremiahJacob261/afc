import { Stack } from '@mui/material';
import Modal from '@mui/material/Modal';
import { useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import LOGO from '../../../public/bradford.ico';
import Image from 'next/image';
import Refresh from '@/public/refresh.png';

export default function Loading({ open,handleClose}) {
    if (!open) return null;
    return (
        // <Modal
        //     open={open}
        //     onClose={handleClose}
        //     aria-labelledby="modal-modal-title"
        //     aria-describedby="modal-modal-description"
        //     style={{ outline: 0 }}
        // >
        //     <Stack className="loading" direction="column" alignItems="center" justifyContent={"center"} sx={{ outline: 0,width:'100%',height:'100vh'}}>
        //         <Stack className="d3" direction="column" alignItems="center" justifyContent={"center"} sx={{ width:'100px', height:'100px',background:'#353431',borderRadius:'16px' }}>
        //             <Image src={Refresh} alt="refresh" width={53} height={50} className='spin'/>
        //         </Stack>
        //     </Stack>
        // </Modal>
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        <Image src={LOGO} width={100} height={100} id='balls' alt="logo" sx={{ marginLeft: '8px' }} />
      </Backdrop>
    )
}