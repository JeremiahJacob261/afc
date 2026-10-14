const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function handlerFor(user, calls) {
  const filename = path.resolve(__dirname, '../pages/api/mobile/signup-profile.js')
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const mocks = {
    '@/lib/apiAuth': {
      getCurrentUser: async () => {
        if (!user) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
        return user
      },
      sendApiError: (res, error) => res.status(error.statusCode || 500).json({ status: 'error', message: error.message }),
    },
    '@/lib/supabaseAdmin': {
      getSupabaseAdmin: () => ({ rpc: async (name, args) => {
        calls.push({ name, args })
        return { data: { created: false, newrefer: '1234567' }, error: null }
      } }),
    },
    '@/lib/apiTiming': { withApiTiming: handler => handler, timedRpc: (_req, db, name, args) => db.rpc(name, args) },
  }
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', output)(name => mocks[name], loaded, loaded.exports)
  return loaded.exports.default
}

const response = () => ({
  status(code) { this.code = code; return this },
  setHeader() {},
  json(body) { this.body = body; return this },
})

test('native provisioning binds identity to the verified bearer user', async () => {
  const calls = []
  const res = response()
  await handlerFor({ id: 'verified-id', email: 'verified@example.com' }, calls)({
    method: 'POST', body: {
      userid: 'forged-id', email: 'forged@example.com',
      username: ' player ', phone: '9123456789', countrycode: '+95', refer: '',
    },
  }, res)
  assert.equal(res.code, 200)
  assert.deepEqual(calls, [{ name: 'provision_native_profile_atomic', args: {
    p_userid: 'verified-id', p_email: 'verified@example.com', p_username: 'player',
    p_phone: '9123456789', p_countrycode: '+95', p_refer: null,
  } }])
})

test('unauthenticated requests cannot reach profile provisioning', async () => {
  const calls = []
  const res = response()
  await handlerFor(null, calls)({ method: 'POST', body: { userid: 'forged-id' } }, res)
  assert.equal(res.code, 401)
  assert.equal(calls.length, 0)
})
