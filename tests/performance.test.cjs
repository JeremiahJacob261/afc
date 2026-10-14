const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

function load(file, mocks = {}, globals = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const module = { exports: {} }
  const actualRequire = createRequire(filename)
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(
    name => name in mocks ? mocks[name] : actualRequire(name), module, module.exports, ...Object.values(globals))
  return module.exports
}
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

test('cache deduplicates in-flight reads, expires entries, and honors forced refresh', async () => {
  let time = 0, calls = 0
  const { createRequestCache } = load('lib/requestCache.js')
  const cache = createRequestCache({ now: () => time })
  const request = deferred()
  const loader = () => { calls++; return request.promise }
  const reads = [cache.get('a', loader, { ttl: 10 }), cache.get('a', loader, { ttl: 10 })]
  request.resolve(42)
  assert.deepEqual(await Promise.all(reads), [42, 42])
  assert.equal(calls, 1)
  assert.equal(await cache.get('a', () => 100, { ttl: 10 }), 42)
  time = 11
  assert.equal(await cache.get('a', () => 100, { ttl: 10 }), 100)
  assert.equal(await cache.get('a', () => 200, { ttl: 10, force: true }), 200)
})

test('invalidation prevents a late request from repopulating the cache', async () => {
  const { createRequestCache } = load('lib/requestCache.js')
  const cache = createRequestCache()
  const old = deferred()
  const first = cache.get('user', () => old.promise, { ttl: 50000 })
  cache.clear()
  assert.equal(await cache.get('user', () => 'new', { ttl: 50000 }), 'new')
  old.resolve('old')
  await first
  assert.equal(await cache.get('user', () => 'unexpected', { ttl: 50000 }), 'new')
})

test('cache failures are retriable and cached responses can be read independently', async () => {
  const { createRequestCache, responseSnapshot, restoreResponse } = load('lib/requestCache.js')
  const cache = createRequestCache()
  await assert.rejects(cache.get('x', () => { throw new Error('offline') }), /offline/)
  const snapshot = await cache.get('x', () => responseSnapshot(async () => new Response('{"ok":true}')), { ttl: 1000 })
  assert.deepEqual(await restoreResponse(snapshot).json(), { ok: true })
  assert.deepEqual(await restoreResponse(snapshot).json(), { ok: true })
})

test('auth cache is isolated by user, cleared after mutations, and excludes eligibility', async () => {
  let session = { user: { id: 'a' }, access_token: 'token-a' }, listener, reads = 0
  const shellMessages = []
  const cache = load('lib/requestCache.js')
  const client = load('lib/clientAuth.js', {
    './operationTiming': { recordOperation: () => {} },
    '@/pages/api/supabase': { supabase: { auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: callback => { listener = callback },
    } } }, './requestCache': cache,
  }, { window: {}, navigator: { serviceWorker: { controller: { postMessage:message=>shellMessages.push(message) } } }, fetch: async () => { reads++; return new Response(JSON.stringify({ read: reads, status: 'success' })) } })
  listener('SIGNED_IN', session) // Supabase emits this while recovering an existing session.
  assert.equal(shellMessages.length,0)
  listener('INITIAL_SESSION', session)
  assert.equal(shellMessages.length,0)
  assert.equal((await (await client.authFetch('/api/me')).json()).read, 1)
  assert.equal((await (await client.authFetch('/api/me')).json()).read, 1)
  session = { user: { id: 'b' }, access_token: 'token-b' }
  listener('SIGNED_IN', session)
  assert.equal(shellMessages.length,1)
  assert.equal((await (await client.authFetch('/api/me')).json()).read, 2)
  await client.authFetch('/api/place-bet', { method: 'POST' })
  assert.equal((await (await client.authFetch('/api/me')).json()).read, 2)
  await client.authFetch('/api/withdrawal-data'); await client.authFetch('/api/withdrawal-data')
  assert.equal(reads, 5)
})

test('pagination cursors reject malformed input and continue strictly below the last ID', async () => {
  const pagination = load('lib/pagination.js')
  assert.equal(pagination.pageSize(500), 50)
  assert.throws(() => pagination.decodeCursor('bad'), /Invalid page cursor/)
  const page = pagination.cursorPage([{ id: 5 }, { id: 4 }, { id: 3 }], 2)
  assert.deepEqual(page, { data: [{ id: 5 }, { id: 4 }], next: '4' })
  const cursor = pagination.decodeCursor(pagination.encodeCursor({ records: page.next }))
  const calls = []
  const query = { lt: (...args) => { calls.push(args); return query }, order: () => query, limit: () => query }
  pagination.applyCursor(query, cursor, 'records', 2)
  assert.deepEqual(calls, [['id', '4']])
  assert.deepEqual(await pagination.applyCursor(query, { records: null }, 'records', 2), { data: [], error: null, count: 0 })
})

function fakeResponse() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value }, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
}

test('bet summary is one bounded RPC using verified identity', async () => {
  const calls = []
  const handler = load('pages/api/my-bets.js', {
    '@/lib/apiAuth': { getCurrentUser: async () => ({ id: 'verified' }), sendApiError: (res, error) => res.status(500).json({ error: error.message }) },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async (name, args) => {
      calls.push({ name, args }); return { data: { unsettled: [{ id: 2 }], settled: [], totalUnsettled: 12 } }
    } }) },
    '@/lib/apiTiming': load('lib/apiTiming.js'), '@/lib/pagination': load('lib/pagination.js'),
  }).default
  const res = fakeResponse()
  await handler({ method: 'GET', query: { summary: '1', userid: 'forged' } }, res)
  assert.equal(res.code, 200)
  assert.equal(res.body.totalUnsettled, 12)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].args.p_userid, 'verified')
  assert.equal(calls[0].args.p_limit, 6)
  assert.equal(calls[0].args.p_summary, true)
})

test('prefetch is disabled for hidden tabs, offline, slow networks and data saving', () => {
  const globals={navigator:{onLine:true,connection:{}},document:{hidden:false}}
  const {canPrefetch}=load('lib/backgroundPrefetch.js',{react:{useEffect:()=>{}},'./clientAuth':{},'./paymentConfiguration':{}},globals)
  assert.equal(canPrefetch(),true)
  globals.navigator.connection.saveData=true; assert.equal(canPrefetch(),false)
  globals.navigator.connection={effectiveType:'3g'}; assert.equal(canPrefetch(),false)
  globals.navigator.connection={}; globals.document.hidden=true; assert.equal(canPrefetch(),false)
  globals.document.hidden=false; globals.navigator.onLine=false; assert.equal(canPrefetch(),false)
})

test('service worker permits only non-personalized user shells and keeps APIs out of caches', () => {
  const vm = require('node:vm')
  const handlers = {}
  const context = { URL, self: { location: { href:'https://example.com/sw.js?build=release-a', origin:'https://example.com' }, addEventListener: (event, handler) => { handlers[event] = handler } } }
  vm.createContext(context)
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/sw.js'),'utf8'),context)
  assert.equal(vm.runInContext("isSafeUserShell('/my/user/account')",context),true)
  assert.equal(vm.runInContext("isSafeUserShell('/en/user/viewbet/private-id')",context),false)
  assert.equal(vm.runInContext("isPrivateRoute('/my/api/me')",context),true)
  assert.equal(vm.runInContext("VERSION",context),'efc-pwa-v4-release-a')
  let intercepted=false
  handlers.fetch({request:{method:'GET',url:'https://example.com/api/me',mode:'cors'},respondWith:()=>{intercepted=true}})
  assert.equal(intercepted,false)
})

test('static translation pages send only their requested sections', async () => {
  const props=load('lib/i18nServerSideProps.js',{
    'next-i18next/serverSideTranslations': {serverSideTranslations:async()=>({_nextI18Next:{initialI18nStore:{en:{common:{common:{back:'Back'},legal:{title:'Terms'},mobile:{secret:'unused'}}}}}})},
    '../next-i18next.config': {i18n:{defaultLocale:'en'}},
  })
  const result=await props.getI18nServerSideProps('en',['legal'])
  assert.deepEqual(Object.keys(result._nextI18Next.initialI18nStore.en.common),['common','legal'])
})

test('performance links use localized native anchors, preserve modified clicks and navigate through Next', () => {
  const pushes = [], warmed = []
  const router = { locale:'en', defaultLocale:'my', basePath:'', push:(...args)=>pushes.push(args) }
  const Link = load('components/PerformanceLink.js', {
    'next/router': { useRouter:()=>router },
    '@/lib/backgroundPrefetch': { prefetchRoute:(_router, href)=>warmed.push(href) },
    'react/jsx-runtime': { jsx:(type,props)=>({type,props}) },
  }).default
  const anchor = Link({href:'/user/bets',children:'Bets'})
  assert.equal(anchor.type,'a')
  assert.equal(anchor.props.href,'/en/user/bets')
  anchor.props.onMouseEnter({}); assert.deepEqual(warmed,['/user/bets'])
  anchor.props.onClick({button:0,ctrlKey:true}); assert.equal(pushes.length,0)
  let prevented=false
  anchor.props.onClick({button:0,preventDefault:()=>{prevented=true}})
  assert.equal(prevented,true)
  assert.equal(pushes[0][0],'/user/bets')
  assert.equal(pushes[0][2].locale,'en')
})
