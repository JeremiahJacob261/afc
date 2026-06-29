const VERSION = 'efc-pwa-v1'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const IMAGE_CACHE = `${VERSION}-images`

const APP_SHELL = [
  '/',
  '/login',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/european.ico',
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

const STATIC_PATH_PREFIXES = [
  '/_next/static/',
  '/assets/',
  '/icons/',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isPrivateRoute(pathname) {
  return PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
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
    cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }

      return networkResponse
    })
    .catch(() => null)

  return cachedResponse || (await networkResponsePromise) || caches.match('/offline.html')
}

async function networkFirstNavigation(request) {
  const url = new URL(request.url)

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && isSameOrigin(url) && !isPrivateRoute(url.pathname)) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    if (isPrivateRoute(url.pathname)) {
      return caches.match('/offline.html')
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
    event.respondWith(networkFirstNavigation(request))
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
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
  }
})
