// Keep the Auth SDK's session saving/refresh logic. Only password login by
// username is proxied, avoiding a browser lookup followed by a cross-origin call.
export function createAuthTransport(supabaseUrl) {
  const origin = supabaseUrl.replace(/\/+$/, '')
  return async (url, options) => {
    if (typeof window !== 'undefined' && String(url).startsWith(`${origin}/auth/v1/token?grant_type=password`)) {
      const body = JSON.parse(options?.body || '{}')
      if (body.email && !body.email.includes('@')) {
        return fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: body.email, password: body.password, captchaToken: body.gotrue_meta_security?.captcha_token }) })
      }
    }
    return fetch(url, options)
  }
}
