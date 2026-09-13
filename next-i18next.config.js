const path = require('path')

/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es', 'it', 'ru'],
    localeDetection: false,
  },
  localePath: path.resolve('./locales'),
}
