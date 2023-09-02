import Cover from "./cover";
import { Stack,Typography,Button,Modal,Divider } from '@mui/material'
import Tet from '../../public/icon/tshow.png'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import Image from "next/image";
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter } from "next/router";
import ubarcode from '../../public/barcode.jpg'
import gbarcode from '../../public/barcode1e.jpg'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import iCopy from '../../public/icon/ion_copy.png'
import { useState,useRef,useEffect } from "react";
import { getStorage, ref, uploadBytes,getDownloadURL }from "firebase/storage";
import { app } from '../api/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import Head from 'next/head'
import { v4 } from "uuid";
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import Wig from '../../public/icon/wig.png'
import { supabase } from '../api/supabase'
import Big from '../../public/icon/badge.png'
import Backdrop from '@mui/material/Backdrop';
export default function Deposit(){
  const [drop,setDrop] = useState(false);
  const router = useRouter();
  //alerts
  const [ale,setAle] = useState('')
  const [open,setOpen] = useState(false)
  const [aleT,setAleT] = useState(false)
  const Alerts = (m,t) =>{
      setAle(m)
      setAleT(t)
      setOpen(true)
    }
  //end
  const [file,setfile] = useState([])
  //from stackoverflow
  const inputFile = useRef(null); 
  //end
  const [method,setMethod] = useState('');
  const [amount,setAmount] = useState(0);
  const auth = getAuth(app);
  const storage =  getStorage(app,"gs://atalanta-77824.appspot.com");
  // {(method === 'usdt') ? 'USDT' : 'Gpay' }
   //file upload
   const checkDepo = async (url) => {
    try{
    let uer= localStorage.getItem('signName');
    const { error } = await supabase
      .from('notification')
      .insert({ address: url, username: uer , amount: amount, sent: 'pending', type: "deposit", method: method } )
    console.log(error)
    setfile([]);
    Alerts('Your Deposit was Successful',true);
    }catch(e){
      
      setDrop(false)
      alert('Please Try again or check your internet connection')
    }
  }
  //firebase
  async function Upload(){
    if (file == null) return;
    try{
 const imageRef = ref(storage, `deposit/${v4() + file.name}`);
    uploadBytes(imageRef, file).then(async () => {
        alert("image uploaded");
         getDownloadURL(ref(storage, imageRef)).then(async (url) => {
console.log(url)
checkDepo(url);
         })
        })
    }catch(e){
        Alerts('Please Try uploading another image',false)
    }
   
  }
  const checkFile = () =>{
    if(file.length === 0){
      Alerts('Please Upload an Image',false)
    }else{
      console.log(file)
      console.log(file.length);
    Upload();
    }
  }
  useEffect(() => {
    setMethod(localStorage.getItem('dm'));
    setAmount(localStorage.getItem('amo'));
    const useri = localStorage.getItem('signedIn');
    if (useri) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

      const uid = localStorage.getItem('signUid');
      const name = localStorage.getItem('signName');
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user

    } else {
      // User is signed out
      // ...
      signOut(auth);
      console.log('sign out');
      localStorage.removeItem('signedIn');
      localStorage.removeItem('signUid');
      localStorage.removeItem('signName');
      router.push('/login');
    }


  }, []);
 
  return(
    <Cover>
      <Head>
          <title>Deposit - Upload Image</title>
          <link rel="icon" href="/logo_afc.ico" />
        </Head>
      <Alertz/>
      <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={drop}
        >
          <SportsSoccerIcon id='balls' sx={{ marginLeft: '8px' }} />
        </Backdrop>
      <Stack direction='column' spacing={2} alignItems='center'>
      <Stack direction='row' alignItems='center' justifyContent='start' spacing={1} sx={{ padding: '8px', margin: '2px',minWidth:'344px'}}>
        <KeyboardArrowLeftOutlinedIcon sx={{ width: '24px', height: '24px' }} onClick={() => {
          router.push('/user/transaction')
        }} />
        <Typography sx={{ fontSize: '16px', fontFamily: 'Poppins,sans-serif', fontWeight: '300' }}>Deposit</Typography>
      </Stack>
      <Stack direction='row' className='warning' justifyContent='center' alignItems='center' sx={{height:'58px',background:'#FBEFEF',borderRadius:'5px',padding:'16px'}} spacing={2}>
      <PriorityHighRoundedIcon sx={{color:'white',background:'#E94E55',width:'20px',height:'20px',borderRadius:'10px'}}/>
      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#E94E55' }}>Please note that the minimum deposit is 10 USDT</Typography>
      </Stack>
        <Stack direction='column' spacing={1} sx={{minWidth:'344px'}}>
          <Typography sx={{fontSize:'12px',fontWeight:'500',fontFamily:'Poppins,sans-serif',color:'black'}}>Wallet Network Address</Typography>
          <Stack direction="row" spacing={2}  alignItems='center' sx={{ padding: '8px',background:'#EFEFEF',borderRadius:'10px' }}>
                  <Image src={Tet} width={40} height={40} alt='rounds'/>
                  <Stack direction='column' justifyContent='start' sx={{width:'196px'}}>
 <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>{(method === 'usdt') ? 'USDT' : 'Gpay' }
                   </Typography>
                   <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '500' }}>{(method === 'usdt') ? 'TRC 20 Network' : 'UPI ID' }</Typography>
                 </Stack>
                 </Stack>
        </Stack>
        <Stack direction='column' spacing={2} className='barcode'>
        <Typography style={{ color:'black',fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '400' }}>Send {(method === 'usdt') ? 'USDT' : 'Gpay' } to this Address</Typography>
        <Image src={(method === 'usdt') ? ubarcode : gbarcode } width={184} height={156} alt='barcode'/>
        </Stack>
        <Stack className='address' spacing={1} sx={{minWidth:'344px'}}>
           <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'black' }}>Address link</Typography>
           <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{height:'58px',background:'#EFEFEF',borderRadius:'5px',padding:'16px'}} spacing={2}>
      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'black' }}>{(method === 'usdt') ? 'TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o' : 'Ashhar Jamal Jafri' }</Typography>
      <Image src={iCopy} width={20} height={20} alt='icopy' onClick={()=>{
        navigator.clipboard.writeText((method === 'usdt') ? 'TRGvFAEiuwW7cuYJA3dsqRQwazCRwgnA8o' : 'Ashhar Jamal Jafri' )
      }}/>
      </Stack>
        </Stack>
        <Stack className='upload' spacing={1} sx={{minWidth:'344px'}}>
           <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'black' }}>Upload Transaction Details</Typography>
          <Stack justifyContent='center' alignItems='center' sx={{ width:'343px',height:'87px',background:'white',borderStyle:'dashed',borderRadius:'10px',border:'2px dashed #EFEFEF'}} 
          onClick={()=>{
             inputFile.current.click();
          }}> 
          <InsertDriveFileIcon sx={{color:'black', fontFamily: 'Poppins,sans-serif'}}/>
          <input type='file' id='file' ref={inputFile} style={{display: 'none'}} 
          accept="image/*" onChange={(e) => {
                setfile(e.target.files[0]);
                console.log(e.target.files[0]);
              }}/>
          <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '500',color:'#03045E' }} onClick={()=>{
             inputFile.current.click();
          }}>Browse</Typography>
          </Stack>
           <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{height:'58px',background:'#EFEFEF',borderRadius:'5px',padding:'16px'}} spacing={2}>
           <InsertDriveFileIcon sx={{color:'#03045E', fontFamily: 'Poppins,sans-serif'}}/>
           <Stack alignItems='start' justifyContent='start'>
           <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'black' }}>{file.name}</Typography>
           <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'black' }}>{file.size}</Typography>
      
           </Stack>
      <ClearIcon sx={{width:'24px',height:'24px',color:'black'}} onClick={()=>{
        setfile([])
      }}/>
      </Stack>
        </Stack>
        <Stack direction='row' className='warning' justifyContent='center' alignItems='center' sx={{height:'58px',background:'#FBEFEF',borderRadius:'5px',padding:'16px'}} spacing={2}>
      <PriorityHighRoundedIcon sx={{color:'white',background:'#E94E55',width:'20px',height:'20px',borderRadius:'10px'}}/>
      <Typography sx={{ fontSize: '12px', fontFamily: 'Poppins,sans-serif', fontWeight: '300',color:'#E94E55' }}>Verify in 20 minutes as faiure to do so may lead to decine in transaction</Typography>
      </Stack>
      <Button variant='contained' sx={{fontFamily:'Poppins,sans-serif',color:'white',background:'#03045E',padding:'8px',width:'343px',height:'50px'}} onClick={checkFile}>Verify</Button>
           
      </Stack>
    </Cover>
  )
  function Alertz(){
    return(
    <Modal
  open={open}
  onClose={()=>{
    if(aleT){
      setOpen(false)
      router.push('/user/withdrawsuccess')
    }else{
      setOpen(false)
    }
    }}
  aria-labelledby="modal-modal-title"
  aria-describedby="modal-modal-description"
>
  <Stack alignItems='center' justifyContent='space-evenly' sx={{background:'white',width:'290px',height:'330px',borderRadius:'20px',
position: 'absolute',
top: '50%',
left: '50%',
transform: 'translate(-50%, -50%)',
padding:'12px'
}}>
  <Image src={aleT ? Big : Wig} width={120} height={120} alt='widh'/>
    <Typography id="modal-modal-title" sx={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:'500'}}>
    
     {aleT ? 'Success' : 'Eh Sorry!'}
    </Typography>
    <Typography id="modal-modal-description" sx={{fontFamily:'Poppins,sans-serif',mt: 2,fontSize:'14px',fontWeight:'300'}}>
     {ale}
    </Typography>
    <Divider sx={{background:'black'}}/>
    <Button variant='contained' sx={{fontFamily:'Poppins,sans-serif',color:'white',background:'#03045E',padding:'8px',width:'100%'}} onClick={()=>{
      if(aleT){
        setOpen(false)
        router.push('/user/depositsuccess')
      }else{

        setOpen(false)
      }
    }}>Okay</Button>
  </Stack>
    
</Modal>)
  }
}