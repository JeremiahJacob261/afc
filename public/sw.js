const BUILD_ID = new URL(self.location.href).searchParams.get('build') || 'local'
const VERSION = `efc-pwa-v4-${BUILD_ID}`
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const IMAGE_CACHE = `${VERSION}-images`
const USER_SHELL_CACHE = `${VERSION}-user-shells`

const LOCALES = new Set(['en', 'my'])
const SAFE_USER_SHELLS = new Set([
  '/user', '/user/account', '/user/faq', '/user/wheel', '/user/bets',
  '/user/fund', '/user/fund/amount', '/user/fund/payment', '/user/fund/receipt',
  '/user/vip', '/user/withdraw',
])

const APP_SHELL = [
  '/',
  '/login',
  '/terms',
  '/privacy',
  '/offline.html',
  '/offline-user.html',
  '/assets/dashboard/star-ball.webp',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/european.ico',
  '/champions-league-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
]

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/api',
  '/user',
  '/_next/data',
]

const PUBLIC_CONTENT = new Set(['/', '/login', '/terms', '/privacy', '/user/faq'])
const MAX_CACHE_ENTRIES = 100
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

async function storeBounded(cache, request, response) {
  try {
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.delete('content-encoding')
    headers.set('x-ucl-cached-at', String(Date.now()))
    const body = await response.arrayBuffer()
    if (body.byteLength > 4 * 1024 * 1024) return
    await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }))
    const keys = await cache.keys()
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_CACHE_ENTRIES)).map(key => cache.delete(key)))
  } catch (_) {
    // Storage quota or permission failures must never hide a healthy network response.
  }
}

function cacheFresh(response) {
  return response && Date.now() - Number(response.headers.get('x-ucl-cached-at') || 0) < CACHE_TTL_MS
}

const STATIC_PATH_PREFIXES = [
  '/_next/static/',
  '/assets/',
  '/icons/',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function normalizePath(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (LOCALES.has(parts[0])) parts.shift()
  return `/${parts.join('/')}`
}

function isPrivateRoute(pathname) {
  const path = normalizePath(pathname)
  return PRIVATE_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function isSafeUserShell(pathname) {
  return SAFE_USER_SHELLS.has(normalizePath(pathname))
}

function isSafeUserData(pathname) {
  const match = pathname.match(/^\/_next\/data\/[^/]+\/(.+)\.json$/)
  if (!match) return false
  const route = `/${match[1].replace(/\/index$/, '')}`
  return isSafeUserShell(route)
}

function isStaticAsset(pathname) {
  return STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isImageRequest(request) {
  return request.destination === 'image'
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)

  if (networkResponse.ok) {
    await storeBounded(cache, request, networkResponse.clone())
  }

  return networkResponse
}

async function staleWhileRevalidate(request, cacheName, event, fallbackPath) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok && !networkResponse.redirected) {
        await storeBounded(cache, request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => null)

  if (cacheFresh(cachedResponse)) {
    event.waitUntil(networkResponsePromise)
    return cachedResponse
  }
  return (await networkResponsePromise) || (fallbackPath ? caches.match(fallbackPath) : Response.error())
}

async function networkFirstNavigation(request) {
  const url = new URL(request.url)

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && isSameOrigin(url) && !isPrivateRoute(url.pathname)) {
      const cache = await caches.open(RUNTIME_CACHE)
      await storeBounded(cache, request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    if (isPrivateRoute(url.pathname)) {
      const path = normalizePath(url.pathname)
      return caches.match(path === '/user' || path.startsWith('/user/') ? '/offline-user.html' : '/offline.html')
    }

    return (
      (await caches.match(request)) ||
      (await caches.match(url.pathname)) ||
      (await caches.match('/')) ||
      caches.match('/offline.html')
    )
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('efc-pwa-') && !cacheName.startsWith(VERSION))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_PUBLIC_CACHE') {
    event.waitUntil(caches.delete(RUNTIME_CACHE))
    return
  }
  if (event.data?.type === 'CLEAR_USER_CACHE') {
    event.waitUntil(caches.delete(USER_SHELL_CACHE))
    return
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (!isSameOrigin(url)) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(isSafeUserShell(url.pathname)
      ? staleWhileRevalidate(request, USER_SHELL_CACHE, event, '/offline-user.html')
      : PUBLIC_CONTENT.has(normalizePath(url.pathname))
        ? staleWhileRevalidate(request, RUNTIME_CACHE, event, '/offline.html')
      : networkFirstNavigation(request))
    return
  }

  if (isSafeUserData(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, USER_SHELL_CACHE, event))
    return
  }

  if (isPrivateRoute(url.pathname)) {
    return
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, event))
  }
})
