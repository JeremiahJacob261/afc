import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import nextI18NextConfig from '../next-i18next.config'

export async function getI18nServerSideProps(locale, sections) {
  const props = await serverSideTranslations(locale || nextI18NextConfig.i18n.defaultLocale, ['common'], nextI18NextConfig)
  if (sections) {
    const allowed = new Set(['common', ...sections])
    for (const language of Object.values(props._nextI18Next.initialI18nStore)) {
      language.common = Object.fromEntries(Object.entries(language.common || {}).filter(([key]) => allowed.has(key)))
    }
  }
  return props
}

