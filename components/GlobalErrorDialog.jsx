import { useEffect, useState } from 'react'
import FeedbackDialog from '@/components/FeedbackDialog'
import { subscribeToErrorDialogs } from '@/lib/errorDialog'

export default function GlobalErrorDialog() {
  const [errors, setErrors] = useState([])

  useEffect(() => {
    return subscribeToErrorDialogs((message) => {
      setErrors((current) => [...current, message])
    })
  }, [])

  return (
    <FeedbackDialog
      open={errors.length > 0}
      type="error"
      message={errors[0]}
      onClose={() => setErrors((current) => current.slice(1))}
    />
  )
}
