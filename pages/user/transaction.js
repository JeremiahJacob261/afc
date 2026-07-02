import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Loading from '@/pages/components/loading'
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

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

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return {
    props: {
      ...i18nProps,
    },
  }
}
