// Memory only: private responses never enter localStorage or a service worker.
export function createRequestCache({ now = Date.now, maxEntries = 100 } = {}) {
  const entries = new Map()
  let generation = 0
  return {
    async get(key, load, { ttl = 0, force = false } = {}) {
      const existing = entries.get(key)
      if (existing?.pending) return existing.pending
      if (!force && existing && existing.expires > now()) return existing.value
      const epoch = generation
      const entry = { expires: 0 }
      const pending = Promise.resolve().then(load).then(value => {
        if (epoch === generation && entries.get(key) === entry) {
          entry.value = value
          entry.expires = now() + ttl
          entry.pending = null
          if (ttl === 0) entries.delete(key)
        }
        return value
      }, error => {
        if (entries.get(key) === entry) entries.delete(key)
        throw error
      })
      entry.pending = pending
      entries.set(key, entry)
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value)
      return pending
    },
    clear() { generation++; entries.clear() },
    invalidateWhere(predicate) {
      for (const key of entries.keys()) if (predicate(key)) entries.delete(key)
    },
    updateWhere(predicate, update) {
      for (const [key, entry] of entries) {
        if (!predicate(key)) continue
        if (entry.pending) entries.delete(key)
        else entry.value = update(entry.value)
      }
    },
  }
}

export const privateRequests = createRequestCache()
export const publicRequests = createRequestCache()
export function invalidatePublicData() {
  publicRequests.clear()
  if (typeof navigator !== 'undefined') navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_PUBLIC_CACHE' })
}

export async function responseSnapshot(load) {
  const response = await load()
  if (!response.ok) {
    const error = new Error('Request failed')
    error.response = response
    throw error
  }
  return { body: await response.text(), status: response.status, headers: [...response.headers] }
}

export function restoreResponse(snapshot) {
  return new Response(snapshot.body, { status: snapshot.status, headers: snapshot.headers })
}

export async function cachedPublicFetch(url, { ttl = 300000, ...options } = {}) {
  if (typeof window === 'undefined') return fetch(url, options)
  try {
    const snapshot = await publicRequests.get(url, () => responseSnapshot(() => fetch(url, options)), { ttl })
    return restoreResponse(snapshot)
  } catch (error) {
    if (error.response) return error.response.clone()
    throw error
  }
}
