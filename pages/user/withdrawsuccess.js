import { Stack, Button, Typography } from '@mui/material'
import Image from 'next/image'
import Cover from './cover'
import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import WS from '@/public/icon/wsuccess.png'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { useTranslation } from 'next-i18next';
export default function Wsuccess() {
  const { t } = useTranslation('common');
  const router = useRouter();
  return (
    <Cover>
      <Stack direction='column' alignItems='center' justifyContent='center' sx={{ minHeight: '90vh', padding: '12px', position: 'relative' }}>
        <Stack sx={{ width: '240px', height: '305px', padding: '8px' }} alignItems='center' justifyContent='center'>
          <Image src={WS} width={150} height={156} alt='ws' />
          <Typography sx={{ fontSize: '18px', fontWeight: '600', color: '#E9E5DA' }}>{t('mobile.withdraw.successTitle')}</Typography>
          <Typography id="modal-modal-description" sx={{ textAlign: 'center', fontFamily: 'Poppins,sans-serif', mt: 2, fontSize: '14px', fontWeight: '300', color: '#E9E5DA' }}>
            {t('messages.withdrawalSent')}
          </Typography>
        </Stack>


        <motion.p onClick={() => {

          router.push('/user/account')
        }}
          whileTap={{ background: '#E9E5DA', color: '#06101F', scale: 0.9 }}
          whileHover={{ background: '#E9E5DA', color: '#06101F', scale: 1.1 }}
          style={{ fontWeight: '500', fontSize: '12px', color: 'white', padding: '10px', background: '#1BB6FF', border: '0.6px solid #10284D', width: '30vh', textAlign: 'center', cursor: 'pointer', borderRadius: '5px' }}>
          {t('status.completed')} !</motion.p>

      </Stack>

    </Cover>
  )
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return {
    props: {
      ...i18nProps,
    },
  }
}
