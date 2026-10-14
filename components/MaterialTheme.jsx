import { ThemeProvider } from '@mui/material/styles'
import { customerTheme, defaultTheme } from '@/lib/customerTheme'

export default function MaterialTheme({ admin, children }) {
  return <ThemeProvider theme={admin ? defaultTheme : customerTheme}>{children}</ThemeProvider>
}
