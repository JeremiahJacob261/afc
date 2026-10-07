import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Cover from './cover'
import faq from '@/pages/api/faq.json'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import styles from '@/styles/UserSubpage.module.css'

export default function Faq() {
  return <Cover>
    <Head><title>UCL — Frequently asked questions</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.page}>
      <Link href="/user/account" className={styles.back}><ArrowLeft size={18} aria-hidden="true" /> Account</Link>
      <div className={styles.heading}><h1>Frequently asked questions</h1><p>Find answers about your UCL account and betting experience.</p></div>
      <div className={styles.accordion}>
        {faq.QA.map((item) => <details key={item.id}><summary><span>{item.Question}</span><ChevronDown size={19} aria-hidden="true" /></summary><div>{item.Answer}</div></details>)}
      </div>
    </main>
  </Cover>
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
