const path = require('path')

/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'my',
    locales: ['en', 'my'],
    localeDetection: false,
  },
  fallbackLng: false,
  localePath: path.resolve('./locales'),
}
