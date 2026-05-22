/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
  domains: ['aidkzrgsgrfotjiouxto.supabase.co','restcountries.eu','firebasestorage.googleapis.com','media-1.api-sports.io','media-2.api-sports.io','media-3.api-sports.io','media.api-sports.io','media-4.api-sports.io','upload.wikimedia.org'],
},
output: 'standalone'
}


module.exports = nextConfig
