import ruCommon from '../../locales/ru/common.json'
import itCommon from '../../locales/it/common.json'
import frCommon from '../../locales/fr/common.json'
import esCommon from '../../locales/es/common.json'
import arCommon from '../../locales/ar/common.json'
import languageConfig from '../../lib/languages.json'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { accountCurrencyPostProcessor } from '../../lib/accountCurrencyClient'

import enCommon from '../../locales/en/common.json'
import myCommon from '../../locales/my/common.json'
import { getLocalStorageItem } from './lib/storage.js'

const languageStorageKey = 'efc-language'
const supportedLanguages = languageConfig.languages.map(language => language.code)

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language || 'en'
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en'

  const storedLanguage = getLocalStorageItem(languageStorageKey, 'en')
  return supportedLanguages.includes(storedLanguage) ? storedLanguage : 'en'
}

if (!i18n.isInitialized) {
  i18n.use(accountCurrencyPostProcessor).use(initReactI18next).init({
    postProcess: ['accountCurrency'],
    resources: {
      en: { common: enCommon },
      my: { common: myCommon },
      ar: { common: arCommon },
      es: { common: esCommon },
      fr: { common: frCommon },
      it: { common: itCommon },
      ru: { common: ruCommon },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
}

applyDocumentLanguage(i18n.language)
i18n.on('languageChanged', applyDocumentLanguage)

export default i18n
