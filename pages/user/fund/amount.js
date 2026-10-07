import DepositFlow from '@/components/user/DepositFlow'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

export default function FundAmountPage() {
  return <DepositFlow step={2} />
}

export async function getServerSideProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
