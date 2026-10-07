import DepositFlow from '@/components/user/DepositFlow'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

export default function FundReceiptPage() {
  return <DepositFlow step={4} />
}

export async function getServerSideProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
