import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Cover from './cover'
import { useTranslation } from 'next-i18next'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import styles from '@/styles/UserSubpage.module.css'

export default function Faq() {
  const { t } = useTranslation('common')
  const items = t('mobile.faq.items', { returnObjects: true })
  return <Cover>
    <Head><title>{`UCL — ${t('website.faqTitle')}`}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <Link href="/user/account" className={styles.back}><ArrowLeft size={18} aria-hidden="true" /> {t('common.account')}</Link>
      <div className={styles.heading}><h1>{t('website.faqTitle')}</h1><p>{t('website.faqIntro')}</p></div>
      <div className={styles.accordion}>
        {items.map((item, index) => <details key={index}><summary><span>{item.q}</span><ChevronDown size={19} aria-hidden="true" /></summary><div>{item.a}</div></details>)}
      </div>
    </main>
  </Cover>
}

export async function getStaticProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
