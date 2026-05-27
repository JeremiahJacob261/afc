import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import LOGO from '@/public/european.ico'

export default function AppLoadingOverlay({
  open,
  title = 'Please wait',
  message = 'We are processing your request.',
}) {
  return (
    <Backdrop
      open={Boolean(open)}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 20,
        bgcolor: 'rgba(6, 16, 31, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#E9E5DA',
      }}
    >
      <Stack
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 'min(86vw, 280px)',
          minHeight: 190,
          p: 3,
          borderRadius: 2,
          bgcolor: 'rgba(16, 40, 77, 0.94)',
          border: '1px solid rgba(27, 182, 255, 0.32)',
          boxShadow: '0 18px 48px rgba(0, 0, 0, 0.38)',
        }}
      >
        <Box
          sx={{
            width: 86,
            height: 86,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(27, 182, 255, 0.12)',
            border: '1px solid rgba(27, 182, 255, 0.28)',
            animation: 'efcLoaderPulse 1.45s ease-in-out infinite',
            '@keyframes efcLoaderPulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.92 },
              '50%': { transform: 'scale(1.08)', opacity: 1 },
            },
          }}
        >
          <Image src={LOGO} width={58} height={58} alt="EFC loading" />
        </Box>
        <Typography sx={{ fontFamily: 'Poppins,sans-serif', fontSize: 17, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(233, 229, 218, 0.78)', textAlign: 'center' }}>
          {message}
        </Typography>
      </Stack>
    </Backdrop>
  )
}
