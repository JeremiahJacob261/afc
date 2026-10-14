// Browser-local measurements only: no credentials, account data, or analytics
// request is recorded. Exportable through window.uclPerformance for diagnostics.
export function recordOperation(operation, started, response) {
  if (typeof window === 'undefined') return
  const networkMs = performance.now() - started
  const serverTiming = response?.headers?.get('server-timing') || ''
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const entry = { operation, networkMs: Math.round(networkMs), paintMs: Math.round(performance.now() - started),
      status: response?.status, serverTiming, time: new Date().toISOString() }
    window.uclPerformance ||= []
    window.uclPerformance.push(entry)
    if (window.uclPerformance.length > 200) window.uclPerformance.shift()
    window.dispatchEvent(new CustomEvent('ucl:operation', { detail: entry }))
  }))
}
