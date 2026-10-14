export function withApiTiming(handler) {
  return async function timedHandler(req, res) {
    const started = performance.now()
    req.timings = []
    const end = res.end
    res.end = function (...args) {
      const total = performance.now() - started
      if (!res.headersSent) {
        res.setHeader('Server-Timing', [...req.timings, ['total', total]]
          .map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`).join(', '))
        res.setHeader('Cache-Control', 'private, no-store')
      }
      console.info('[api-timing]', JSON.stringify({ route: (req.url || '').split('?')[0], method: req.method,
        status: res.statusCode, ms: Math.round(total), stages: Object.fromEntries(req.timings.map(([k, v]) => [k, Math.round(v)])) }))
      return end.apply(this, args)
    }
    return handler(req, res)
  }
}

export async function timedRpc(req, supabase, name, args) {
  const start = performance.now()
  try { return await supabase.rpc(name, args) }
  finally { req.timings?.push(['database', performance.now() - start]) }
}
