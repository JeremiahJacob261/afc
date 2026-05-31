import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Loading from '@/pages/components/loading'
import Cover from './cover'

export default function TransactionRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/user/fund')
  }, [router])

  return (
    <Cover>
      <Loading open handleClose={() => { }} />
    </Cover>
  )
}
