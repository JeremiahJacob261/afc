import Head from 'next/head'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps'

export default function Privacy() {
  const { t } = useTranslation('common')

  return (
    <main className="min-h-screen bg-white text-gray-900 px-6 py-10">
      <Head>
        <title>{t('legal.privacy.title')}</title>
        <meta name="description" content={t('legal.privacy.description')} />
      </Head>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-[#1BB6FF]">{t('legal.common.backToEfc')}</Link>
        <h1 className="text-3xl font-black">{t('legal.privacy.title')}</h1>
        <p>{t('legal.privacy.collection')}</p>
        <p>{t('legal.privacy.storage')}</p>
        <p>{t('legal.privacy.contact')}</p>
        <p className="text-sm text-gray-500">{t('legal.common.lastUpdated')}</p>
      </div>
    </main>
  )
}

export async function getServerSideProps(context) {
  return { props: await getI18nServerSideProps(context.locale) }
}
