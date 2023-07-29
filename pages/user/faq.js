import { useState } from 'react'
import { Stack, Container } from '@mui/material'
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/router'
import faq from '../api/faq.json'
import CloseIcon from '@mui/icons-material/Close';
export default function Faq() {
  const [expanded, setExpanded] = useState(false);

  let i = 0;
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div stylle={{minHeight:'80vh'}}>
      <Stack direction="row" justifyContent="left">
        <CloseIcon style={{ color: 'white', width: '30px', height: '30px', margin: '8px' }} />
      </Stack>
      <Typography sx={{ width: '100%', height: '91px', color: '#D9D9D9', textAlign: 'center', fontSize: '32px', fontWeight: '900' }}>
        FREQUENTLY ASKED QUESTIONS
      </Typography>
      <Container sx={{ height: '42px' }}></Container>
      <Stack sx={{padding:'8px'}}>
      {
        faq.QA.map((f)=>{
         
          return(
            <Accordion expanded={expanded === `panel${f.id}`} onChange={handleChange(`panel${f.id}`)}
            sx={{background:'#1A1B72'}}
            key={f.id}
            >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#EE8F00' }}/>}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0,color:'white',fontFamily:'Poppins,sans-serif' }}>
            {f.Question}
          </Typography>
          <Typography sx={{ color: 'white' }}></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: 'white',fontWeight:'100',fontSize:'15px',fontFamily:'Poppins,sans-serif' }}>
           {f.Answer}
          </Typography>
        </AccordionDetails>
      </Accordion>
          )
        })
      }
      </Stack>
      
    </div>
  )
}