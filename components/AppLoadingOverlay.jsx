import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import LOGO from '@/public/champions-league-logo.png'
import { useTranslation } from 'next-i18next'

export default function AppLoadingOverlay({
  open,
  title = 'Please wait',
  message = 'We are processing your request.',
}) {
  const { t } = useTranslation('common')
  return (
    <Backdrop
      open={Boolean(open)}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 20,
        bgcolor: 'transparent ',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#E9E5DA',
      }}
    >
        <Box
          className="route-loading-mark"
          sx={{
            width: 86,
            height: 86,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(255, 45, 149, 0.12)',
            border: '1px solid rgba(255, 45, 149, 0.32)',
            boxShadow: '0 10px 32px rgba(0, 45, 114, 0.2)',
            animation: 'efcLoaderPulse 1.45s ease-in-out infinite',
            '@keyframes efcLoaderPulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.92 },
              '50%': { transform: 'scale(1.08)', opacity: 1 },
            },
          }}
        >
          <Image src={LOGO} width={58} height={58} alt={t('common.loading')} />
        </Box>
    </Backdrop>
  )
}
