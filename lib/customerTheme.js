import { createTheme } from '@mui/material/styles'

export const defaultTheme = createTheme()

// Mirrors UclDarkColorScheme in the native Android app.
export const customerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8db8ff', contrastText: '#002d72' },
    secondary: { main: '#ff8ac4', contrastText: '#4b002b' },
    background: { default: '#000a1e', paper: '#091b34' },
    text: { primary: '#f2f5fa', secondary: '#d4deef' },
    divider: '#475e7d',
    error: { main: '#ffb4ab' },
    success: { main: '#8fe0ae' },
    warning: { main: '#f5d58a' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#10284d' },
        notchedOutline: { borderColor: '#8293b0' },
      },
    },
  },
})
