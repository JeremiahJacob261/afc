import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import nextI18NextConfig from '../next-i18next.config'

export async function getI18nServerSideProps(locale) {
  return serverSideTranslations(locale || nextI18NextConfig.i18n.defaultLocale, ['common'], nextI18NextConfig)
}

