/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config')
const nextConfig = {
  i18n,
  reactStrictMode: true,
  images: {
  domains: ['aidkzrgsgrfotjiouxto.supabase.co','firebasestorage.googleapis.com','media-1.api-sports.io','media-2.api-sports.io','media-3.api-sports.io','media.api-sports.io','media-4.api-sports.io'],
}
}


module.exports = nextConfig
