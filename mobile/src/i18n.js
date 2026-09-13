import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '../../locales/en/common.json'
import esCommon from '../../locales/es/common.json'
import frCommon from '../../locales/fr/common.json'
import itCommon from '../../locales/it/common.json'
import ruCommon from '../../locales/ru/common.json'
import { getLocalStorageItem } from './lib/storage.js'

const languageStorageKey = 'efc-language'
const supportedLanguages = ['en', 'fr', 'es', 'it', 'ru']

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language || 'en'
  document.documentElement.dir = 'ltr'
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en'

  const storedLanguage = getLocalStorageItem(languageStorageKey, 'en')
  return supportedLanguages.includes(storedLanguage) ? storedLanguage : 'en'
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        common: enCommon,
      },
      fr: {
        common: frCommon,
      },
      es: {
        common: esCommon,
      },
      it: {
        common: itCommon,
      },
      ru: {
        common: ruCommon,
      },
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
