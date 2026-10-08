import Head from 'next/head'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import styles from '@/styles/UserSubpage.module.css'

export default function WithdrawSuccess() {
  const { t } = useTranslation('common')
  return <Cover>
    <Head><title>{`${t('mobile.withdraw.successTitle')} — UCL`}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.successPage}>
      <div className={styles.successIcon}><Check size={32} strokeWidth={2} aria-hidden="true" /></div>
      <h1>{t('mobile.withdraw.successTitle')}</h1>
      <p>{t('messages.withdrawalSent')}</p>
      <Link href="/user/account" className={styles.primaryLink}>{t('common.done')} <ArrowRight size={18} aria-hidden="true" /></Link>
    </main>
  </Cover>
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
