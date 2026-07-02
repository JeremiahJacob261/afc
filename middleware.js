import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_session'
const API_CORS_ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

function getCorsHeaders(request) {
  const origin = request.headers.get('origin')

  if (!origin || !API_CORS_ALLOWED_ORIGINS.has(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Admin-Password, X-Internal-Secret',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function withCors(response, headers) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

async function getAdminSessionToken(secret) {
  const input = new TextEncoder().encode(`afc-admin-session:${secret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function isPublicAdminPath(pathname) {
  return pathname === '/admin'
    || pathname === '/api/admin/login'
    || pathname === '/api/admin/logout'
    || pathname === '/api/admin/session'
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const isApiPath = pathname.startsWith('/api')
  const corsHeaders = isApiPath ? getCorsHeaders(request) : {}

  if (isApiPath && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return withCors(NextResponse.next(), corsHeaders)
  }

  if (isPublicAdminPath(pathname)) {
    return withCors(NextResponse.next(), corsHeaders)
  }

  const secret = process.env.ADMIN_SESSION_SECRET
    || process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
  const adminPassword = process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const headerPassword = request.headers.get('x-admin-password')

  if (secret && session === await getAdminSessionToken(secret)) {
    return withCors(NextResponse.next(), corsHeaders)
  }

  if (adminPassword && headerPassword === adminPassword) {
    return withCors(NextResponse.next(), corsHeaders)
  }

  if (pathname.startsWith('/api/admin')) {
    return withCors(NextResponse.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    ), corsHeaders)
  }

  const loginUrl = new URL('/admin', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
