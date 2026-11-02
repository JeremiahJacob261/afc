const path = require('path')
const languages = require('./lib/languages.json')

/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: languages.defaultLanguage,
    locales: languages.languages.map(language => language.code),
    localeDetection: false,
  },
  fallbackLng: 'en',
  localePath: path.resolve('./locales'),
}
