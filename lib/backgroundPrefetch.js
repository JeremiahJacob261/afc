import { useEffect } from 'react'

const prefetched = new Map()
let chain = Promise.resolve()
let screen = 0

export function canPrefetch() {
  if (typeof navigator === 'undefined' || !navigator.onLine || document.hidden) return false
  const connection = navigator.connection
  return !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType)
}

export function prefetchRoute(router, href, epoch = screen) {
  const path = typeof href === 'string' ? href : href?.pathname
  if (!path?.startsWith('/user') || !canPrefetch()) return Promise.resolve()
  const key = `${router.locale}:${path}`
  if ((prefetched.get(key) || 0) > Date.now()) return Promise.resolve()
  prefetched.set(key, Date.now() + 300000)
  chain = chain.catch(() => {}).then(async () => {
    if (screen !== epoch || !canPrefetch()) { prefetched.delete(key); return }
    try { await router.prefetch(path) } catch { prefetched.delete(key) }
  })
  return chain
}

export function useBackgroundPrefetch(router, ready) {
  useEffect(() => {
    const epoch = ++screen
    if (!ready) return
    const routes = router.pathname === '/user' ? ['/user/matches', '/user/bets']
      : router.pathname === '/user/account' ? ['/user/history', '/user/vip'] : []
    let idle
    const timer = setTimeout(() => {
      const warm = () => routes.forEach(path => prefetchRoute(router, path, epoch))
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(warm)
      else warm()
    }, 1000)
    return () => { clearTimeout(timer); if (idle !== undefined) window.cancelIdleCallback(idle); screen++ }
  }, [router, ready])
}
