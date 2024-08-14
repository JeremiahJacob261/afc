import { useRouter } from 'next/router';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Icon } from '@iconify/react';
import ClearIcon from '@mui/icons-material/Clear';
import { Stack, Typography, Button } from '@mui/material';
import { useState, useRef } from 'react';
import { supabase } from '@/pages/api/supabase';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid';
import Loading from "@/pages/components/loading";
import { useEffect } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Cover from './cover'
import CircularProgress from '@mui/material/CircularProgress';
import toast ,{ Toaster } from 'react-hot-toast';

export default function Upload() {

  const [amount,setAmount] =useState('')
  const [name,setName] =useState('')
  const [method,setMethod] =useState('')

  const router = useRouter();
  const [file, setfile] = useState([]);
      //the below controls the loading modal
      const [openx, setOpenx] = useState(false);
      const handleOpenx = () => setOpenx(true);
      const handleClosex = () => setOpenx(false);
  
      //the end of thellaoding modal control
  const [modified, setModified] = useState('');
  const [drop, setDrop] = useState(false);
  //from stackoverflow
  const inputFile = useRef(null);
  //end
  const uploadData = async (address) => {

    try {

      // let adminadd = localStorage.getItem('randomed');
      const { data, error } = await supabase
        .from('notification')
        .insert({
          'username': name,
          'amount': amount,
          'type': 'deposit',
          'method': method,
          'address': address,
          'adminaddress': 'none'
        })
      localStorage.removeItem('amo');
      handleClosex()
    } catch (error) {
      handleClosex()
      console.log(error)
    }
  }
  const getURL = async (modifiede) => {

    try {
      const { data, error } = supabase
        .storage
        .from('trcreceipt/public')
        .getPublicUrl(modifiede);
      uploadData(data.publicUrl);
      console.log(data.publicUrl);
    } catch (error) {
      handleClosex()
      console.log(error)
    }


  }
  const fileNameMod = () => {
    const uuid = uuidv4();
    const modifieds = uuid + file.name;
    console.log(modifieds)
    setModified(modifieds);
    return modifieds;
  }
  const uploadImage = async (modifiede) => {
    handleOpenx()
    try {
      const { data, error } = await supabase
        .storage
        .from('trcreceipt/public')
        .upload(modifiede, file);
      console.log(data)
      getURL(modifiede);
      if (error) {
        toast.error('Error uploading file.');
        handleClosex()
        console.log(error)
        return;
      }
    } catch (error) {
      console.log(error)
    }


    toast.success('File uploaded successfully!');
    router.push('/user/depositsuccess');
  }
  const checkParams = () => {
    if (file.name) {

      uploadImage(fileNameMod());
    } else {
      toast.error('Please select a file')
    }

  }

  // const [currentTxt, setCurrentTxt] = useState('receipt');
  // const changingtext = {
  //     1:'receipt',
  //     2:'image of proof',
  //     3:'payment proof',
  //     4:'screenshot transaction'
  // }
  useEffect(() => {
    console.log(localStorage.getItem('amo'))
    setAmount(localStorage.getItem('amo'));
    setName(localStorage.getItem('signNames'));
    setMethod(localStorage.getItem('dm'));
    if (localStorage.getItem('amo') === null) {
      router.push('/user/fund')
    }
    // setInterval(()=>{
    //     setCurrentTxt(changingtext[Math.floor(Math.random() * 3) + 1])
    // },1000);
  }, [])
  return (
    <Cover>
    <div className="backgrounds" style={{ minHeight: '99vh' }}>
    <Loading open={openx} handleClose={handleClosex} />
    <Toaster position="bottom-center"
        reverseOrder={false} />
      <Stack className='headers' direction="row" alignItems='center' sx={{ padding: '8px', width: '100%' }} spacing={1}>
        <Icon icon="material-symbols:arrow-back-ios-new-rounded" style={{ color:'#ffffff'}} width={24} height={24} onClick={() => {
          router.back()
        }} />
        <p style={{ fontSize: '16px', fontWeight: '600' ,color:'#cacaca'}}>Upload receipt</p>
      </Stack>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={drop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Stack direction='column' justifyContent='center' alignItems="center" sx={{ height: '90vh' }} spacing={2}>
      <Stack direction='row' className='warning' justifyContent='center' alignItems='center' sx={{ height: '58px', background: '#FBEFEF', borderRadius: '5px', padding: '16px',maxWidth:'340px' }} spacing={2}>
          <PriorityHighRoundedIcon sx={{ color: '#242627', background: '#E94E55', width: '20px', height: '20px', borderRadius: '10px' }} />
          <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: '#E94E55' }}>Please deposit only {amount} {method} to the address below, depositing any amount other than this may result in lost funds.</Typography>
        </Stack>
        <motion.div
          whileTap={{ scale: 1.09 }}
          whileHover={{ scale: 1.1 }}
        >
          <Stack justifyContent='center' alignItems='center' sx={{ width: '343px', height: '87px', background: '#373636', borderStyle: 'dashed', borderRadius: '10px', border: '1.5px dashed rgba(194,127,8,1)' }}
            onClick={() => {
              inputFile.current.click();
            }}>
            <InsertDriveFileIcon sx={{ color: '#E94E55', fontFamily: 'Poppins,sans-serif' }} />
            <input type='file' id='file'
              ref={inputFile} style={{ display: 'none' }}
              accept="image/*" onChange={(e) => {
                setfile(e.target.files[0]);
                console.log(e.target.files[0]);
              }} />
            <p style={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '500', color: 'white' }} onClick={() => {
              // inputFile.current.click();
            }}>Browse</p>
          </Stack>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.04 }}
        >
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ height: '58px', background: '#E94E55', borderRadius: '5px', border: '0.5px solid #373636', padding: '16px' }} spacing={2}>
            <InsertDriveFileIcon sx={{ color: 'white', fontFamily: 'Poppins,sans-serif' }} />
            <Stack alignItems='center' justifyContent='start' spacing={1}>
              <p style={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white' }}>{file.name ? file.name : 'No File Selected'}</p>
              <p style={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300', color: 'white' }}>{file.size ? file.size : '0.0mb'}</p>

            </Stack>
            <ClearIcon sx={{ width: '24px', height: '24px', color: '#573b41' }} onClick={() => {
              setfile([])
            }} />
          </Stack>
        </motion.div>
        <motion.p onClick={checkParams}
          whileTap={{ background: '#373636', color: '#E94E55', scale: 0.9 }}
          whileHover={{ background: '#373636', color: '#E94E55', scale: 1.1 }}
          style={{ fontWeight: '500',minWidth:'340px', fontSize: '12px', color: 'white', padding: '16px', background: '#E94E55', border: '0.6px solid #373636', width: '30vh', textAlign: 'center', cursor: 'pointer', borderRadius: '5px' }}>
          COMPLETE !</motion.p>

      </Stack>
    </div>
    </Cover>
  )
}