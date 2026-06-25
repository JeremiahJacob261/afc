/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://v3.football.api-sports.io https://api-football-v1.p.rapidapi.com https://translate.googleapis.com",
      "frame-src https://translate.google.com",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const privatePageHeaders = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow, noarchive',
  },
]

const nextConfig = {
  reactStrictMode: true,
  images: {
  domains: ['pctajnbqkposgymgbqkc.supabase.co','restcountries.eu','firebasestorage.googleapis.com','media-1.api-sports.io','media-2.api-sports.io','media-3.api-sports.io','media.api-sports.io','media-4.api-sports.io','upload.wikimedia.org'],
},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/register/:path*',
        headers: privatePageHeaders,
      },
      {
        source: '/login',
        headers: privatePageHeaders,
      },
      {
        source: '/passwordreset',
        headers: privatePageHeaders,
      },
      {
        source: '/user/:path*',
        headers: privatePageHeaders,
      },
      {
        source: '/admin/:path*',
        headers: privatePageHeaders,
      },
    ]
  },
}


module.exports = nextConfig
