import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import Image from 'next/image'
import LOGO from '@/public/european.ico'

const contentByType = {
  success: {
    icon: CheckCircleRoundedIcon,
    color: '#2ECFC4',
    title: 'Success',
  },
  error: {
    icon: ErrorRoundedIcon,
    color: '#FFB4AB',
    title: 'Something went wrong',
  },
  info: {
    icon: InfoRoundedIcon,
    color: '#1BB6FF',
    title: 'Information',
  },
}

export default function FeedbackDialog({
  open,
  type = 'info',
  title,
  message,
  actionLabel = 'Okay',
  onClose,
}) {
  const content = contentByType[type] || contentByType.info
  const Icon = content.icon
  const dialogTitle = title || content.title

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      aria-labelledby="feedback-dialog-title"
      aria-describedby="feedback-dialog-description"
      PaperProps={{
        sx: {
          width: 'min(90vw, 360px)',
          m: 2,
          borderRadius: 2,
          bgcolor: '#10284D',
          color: '#E9E5DA',
          border: '1px solid rgba(27, 182, 255, 0.24)',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ height: 4, bgcolor: content.color }} />
      <Stack spacing={2} alignItems="center" sx={{ p: 3 }}>
        <Box sx={{ position: 'relative', width: 82, height: 82, display: 'grid', placeItems: 'center' }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              bgcolor: `${content.color}22`,
              border: `1px solid ${content.color}55`,
            }}
          />
          <Image src={LOGO} width={44} height={44} alt="EFC" />
          <Icon sx={{ position: 'absolute', right: -2, bottom: 2, color: content.color, bgcolor: '#10284D', borderRadius: '50%' }} />
        </Box>
        <Typography id="feedback-dialog-title" sx={{ fontFamily: 'Poppins,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', color: '#0e1068' }}>
          {dialogTitle}
        </Typography>
        <Typography id="feedback-dialog-description" sx={{ fontFamily: 'Inter,sans-serif', fontSize: 14, lineHeight: 1.55, color: 'rgba(26, 8, 118, 0.82)', textAlign: 'center' }}>
          {message}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            mt: 1,
            height: 44,
            borderRadius: 1.5,
            bgcolor: '#1BB6FF',
            color: '#06101F',
            fontFamily: 'Poppins,sans-serif',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: '#2ECFC4' },
          }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Dialog>
  )
}
