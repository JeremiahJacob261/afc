import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import Cover from './cover'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'
import { DEPOSIT_SUCCESS_KEY, formatMoney } from '@/lib/depositFlow'
import { supabase } from '@/pages/api/supabase'
import styles from '@/styles/UserSubpage.module.css'

export default function DepositSuccess() {
  const { t } = useTranslation('common')
  const [amount, setAmount] = useState(null)
  useEffect(() => {
    let active = true
    async function readSubmission() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(DEPOSIT_SUCCESS_KEY) || 'null')
        const { data } = await supabase.auth.getSession()
        const value = Number(saved?.usdtAmount)
        if (active && data?.session?.user?.id === saved?.userId && Number.isFinite(value) && value > 0) {
          setAmount(formatMoney(value))
        }
      } catch (_) {
        // The generic success copy remains accurate without a stored summary.
      }
    }
    readSubmission()
    return () => { active = false }
  }, [])
  return <Cover>
    <Head><title>UCL — Deposit submitted</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main className={styles.successPage}>
      <div className={styles.successIcon}><Check size={32} strokeWidth={2} aria-hidden="true" /></div>
      <h1>{t('mobile.deposit.successTitle')}</h1>
      <p>{amount ? t('messages.depositSubmittedWithAmount', { amount }) : t('messages.depositSubmitted')}</p>
      <Link href="/user" className={styles.primaryLink}>{t('common.continue')} <ArrowRight size={18} aria-hidden="true" /></Link>
    </main>
  </Cover>
}

export async function getServerSideProps(context) {
  const i18nProps = await getI18nServerSideProps(context.locale)
  return { props: { ...i18nProps } }
}
