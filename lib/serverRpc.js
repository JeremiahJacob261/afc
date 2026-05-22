function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host

  if (host) {
    return `${protocol}://${host}`
  }

  return `http://localhost:${process.env.PORT || 3000}`
}

export async function callInternalRpc(req, functionName, params = {}) {
  const secret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    const error = new Error('Missing INTERNAL_API_SECRET or SUPABASE_SERVICE_ROLE_KEY')
    error.statusCode = 500
    throw error
  }

  const response = await fetch(`${getBaseUrl(req)}/api/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': secret,
    },
    body: JSON.stringify(params),
  })
  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(json.error || json.message || `RPC ${functionName} failed`)
    error.statusCode = response.status
    error.details = json
    throw error
  }

  return json
}
