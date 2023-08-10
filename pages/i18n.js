import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en', // Default language
  debug: true, // Enable debug mode (optional)

  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
