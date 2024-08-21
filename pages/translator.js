import * as React from 'react';
import { useState } from 'react';
import { Stack } from '@mui/material';
import Modal from '@mui/material/Modal';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useEffect } from "react";
import { parseCookies, setCookie } from "nookies";

const COOKIE_NAME = "googtrans";

export default function Translate() {


    const languages = [
        {
            "name": "English",
            "code": "en",
            "flag": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/125px-Flag_of_the_United_Kingdom_%281-2%29.svg.png"
        },
        {
            "name": "español",
            "code": "es",
            "flag": "https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Flag_of_Spain.svg/750px-Flag_of_Spain.svg.png?20160610210450"
        },
        {
            "name": "Lingua italiana",
            "code": "it",
            "flag": "https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Flag_of_Italy.svg/125px-Flag_of_Italy.svg.png"
        },
        {
            "name": "Indonesia",
            "code": "id",
            "flag": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_Indonesia.svg/125px-Flag_of_Indonesia.svg.png"
        },
        {
            "name": "မြန်မာဘာသာ",
            "code": "my",
            "flag": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Flag_of_Myanmar.svg"
        },
        {
            "name": "فارسی",
            "code": "fa",
            "flag": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_Iran_%28official%29.svg/125px-Flag_of_Iran_%28official%29.svg.png"
        },
        {
            "name": "langue française",
            "code": "fr",
            "flag": "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/125px-Flag_of_France.svg.png"
        }
    ];

    const [open, setOpen] = useState(false);
    const startTranslate = () => {
        setOpen(true);
    }
    const router = useRouter();

    const changeLanguageHandler = (lang) => {
        try {
            // router.push(router.pathname, router.asPath, { locale: lang });
            //disabled for now
            setCookie(null, COOKIE_NAME, "/auto/" + lang)
            window.location.reload();
            // alert("Translation is disabled for now, please use the browser's translation feature");
            setOpen(false);
        } catch (e) {
            console.log(e);
        }


    };

    const [currentLanguage, setCurrentLanguage] = useState();
    const [languageConfig, setLanguageConfig] = useState();

    useEffect(() => {
        const cookies = parseCookies()
        const existingLanguageCookieValue = cookies[COOKIE_NAME];

        let languageValue;
        try {
            if (existingLanguageCookieValue) {
                const sp = existingLanguageCookieValue.split("/");
                if (sp.length > 2) {
                    languageValue = sp[2];
                }
            }
            if (global.__GOOGLE_TRANSLATION_CONFIG__ && !languageValue) {
                languageValue = global.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage;
            }
            if (languageValue) {
                setCurrentLanguage(languageValue);
            }
            if (global.__GOOGLE_TRANSLATION_CONFIG__) {
                setLanguageConfig(global.__GOOGLE_TRANSLATION_CONFIG__);
            }
        } catch (e) {
            console.log(e);
        }
    }, []);

    if (!currentLanguage || !languageConfig) {
        return null;
    }

    //  const switchLanguage = (lang) => () => {

    //  };
    return (
        <div className='notranslate'>

            {/* <motion.div whileHover={{ scale:1.1 }} whileTap={{ scale:0.7 }}>
             
             
              <Icon icon="ph:translate" color="green" width="24" height="24" onClick={startTranslate} />
      </motion.div> */}
            {/* <Modal
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack alignItems='center'
          justifyContent='space-evenly'
          spacing={1}
          sx={{
            background: '#E5E7EB', width: '290px', height: '490px', borderRadius: '20px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '12px'
          }}
          className='notranslate'
        >
          <h1 style={{ color: '#104547', fontWeight: '500', fontSize: '17px' }}>Translate</h1>
          <motion.p onClick={() => { changeLanguageHandler('en') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>English EN</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('de') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Deutsch DE</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('es') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Español ES</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('fr') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Français FR</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('ru') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Русский RU</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('in') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Indonesian IN</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('pl') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Polski PL</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('vi') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Vietnamese VI</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('fa') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>فارسی FA</motion.p>
          <motion.p onClick={() => { changeLanguageHandler('pt') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} className='translate-txt'>Português PT</motion.p>

        </Stack>
      </Modal> */}

            <Stack direction="column" spacing={1} sx={{ width: '100%', height: 'auto', padding: '12px', background: '#2D2F2F', borderRadius: '8px', border: '0.6px solid #373636' }}>
                {
                    languages.map((l) => {
                        return (
                            <Stack direction="column" spacing={1} key={l.name} onClick={() => { changeLanguageHandler(l.code) }}>
                                <Stack sx={{ width: '100%',cursor:'pointer' }} direction={"row"} spacing={1} alignItems="center" justifyContent={"start"}>
                                    <Image src={l.flag} alt={l.name} width={24} height={18} />
                                    <p style={{ color: '#cacaca', fontFamily: 'Poppins,sans-serif', fontSize: '13px', fontWeight: "300" }}>{l.name}</p>
                                </Stack>
                                <div style={{ border: '0.05px solid #4A4A4A', width: '100%' }}></div>
                            </Stack>
                        );
                    })
                }
            </Stack>
        </div>
    )
}