import DepositFlow from '@/components/user/DepositFlow'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

export default function FundPaymentPage() {
  return <DepositFlow step={3} />
}

export async function getStaticProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
