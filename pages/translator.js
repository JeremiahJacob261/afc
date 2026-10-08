import LocaleSwitcher from '@/components/LocaleSwitcher'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

// Retain the legacy route, using the same locale routing as the rest of the site.
export default function Translate() {
  return <LocaleSwitcher />
}

export async function getStaticProps({ locale }) {
  return { props: await getI18nServerSideProps(locale) }
}
