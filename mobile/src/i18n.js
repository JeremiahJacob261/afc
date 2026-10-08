import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '../../locales/en/common.json'
import myCommon from '../../locales/my/common.json'
import { getLocalStorageItem } from './lib/storage.js'

const languageStorageKey = 'efc-language'
const supportedLanguages = ['en', 'my']

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language || 'my'
  document.documentElement.dir = 'ltr'
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'my'

  const storedLanguage = getLocalStorageItem(languageStorageKey, 'my')
  return supportedLanguages.includes(storedLanguage) ? storedLanguage : 'my'
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      my: { common: myCommon },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'my',
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
