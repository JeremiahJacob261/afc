import { fixture, bets } from './fixtures'
export async function requireSession() { return { user: { id: 'synthetic-preview' } } }
export function clearLegacyAuthStorage() {}
export async function authFetch(url, options) {
  if (options?.method && options.method !== 'GET') throw new Error('Preview cannot submit mutations')
  const body = url.startsWith('/api/my-bets') ? bets : url.startsWith('/api/my-bet') ? { bet: bets.settled[2], match: fixture } : { profile: { balance: 100000, gcount: 0 }, vip: { viplevel: 1 } }
  return { status: 200, ok: true, json: async () => ({ status: 'success', ...body }) }
}
export const supabase = { auth: { signOut: async () => {} } }
export async function getI18nServerSideProps() { return {} }
