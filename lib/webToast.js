import hotToast, { Toaster } from 'react-hot-toast'
import { showErrorDialog } from '@/lib/errorDialog'

const toast = Object.assign((...args) => hotToast(...args), hotToast)

toast.error = (message) => showErrorDialog(message)

export { toast, Toaster }
export default toast
