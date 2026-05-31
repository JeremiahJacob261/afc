import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_session'

async function getAdminSessionToken(secret) {
  const input = new TextEncoder().encode(`afc-admin-session:${secret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function isPublicAdminPath(pathname) {
  return pathname === '/admin'
    || pathname === '/api/admin/signin'
    || pathname === '/api/admin/logout'
    || pathname === '/api/admin/session'
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_SESSION_SECRET
    || process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
  const adminPassword = process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const headerPassword = request.headers.get('x-admin-password')

  if (secret && session === await getAdminSessionToken(secret)) {
    return NextResponse.next()
  }

  if (adminPassword && headerPassword === adminPassword) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const loginUrl = new URL('/admin', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
