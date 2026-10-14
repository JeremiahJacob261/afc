const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

function load(file, mocks = {}) {
  const cache = new Map()
  function moduleFor(filename) {
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }; cache.set(filename, module)
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    const requireActual = createRequire(filename)
    new Function('require','module','exports',code)(name => {
      if (name in mocks) return mocks[name]
      const local = name.startsWith('@/') ? path.resolve(__dirname,'..',name.slice(2))
        : name.startsWith('.') ? path.resolve(path.dirname(filename),name) : null
      return local ? moduleFor(local.endsWith('.js') ? local : local+'.js') : requireActual(name)
    }, module, module.exports)
    return module.exports
  }
  return moduleFor(path.resolve(__dirname,'..',file))
}
function response() {
  return { headers: {}, statusCode: 200, setHeader(k,v) { this.headers[k]=v }, end() {},
    status(code) { this.statusCode=code; return this }, json(body) { this.body=body; this.end(); return this } }
}

test('admin actions retain their recovery guidance when a server returns generic errors', () => {
  const { adminErrorMessage } = load('lib/adminErrorMessage.js')
  const fallback = 'Check the transaction status before trying again.'
  assert.equal(adminErrorMessage({ message: 'Server error' }, fallback), fallback)
  assert.equal(adminErrorMessage(new TypeError('Failed to fetch'), fallback), fallback)
  assert.equal(adminErrorMessage({ message: 'Invalid admin credentials' }, fallback), 'Invalid admin credentials')
  assert.match(adminErrorMessage({ status: 401 }, fallback), /session expired/)
})

test('bet validation returns the correct reason through the real API handler', async () => {
  const { handler, calls } = fixture('pages/api/place-bet.js')
  const valid = { match_id: 'match-1', picked: 'nilnil', stake: 2500, expected_odd: 1.5 }
  for (const [change, expected] of [
    [{ stake: 2000 }, 'BET_MINIMUM_STAKE'],
    [{ stake: 'abc' }, 'BET_INVALID_STAKE'],
    [{ expected_odd: null }, 'BET_INVALID_DETAILS'],
    [{ picked: 'invalid' }, 'BET_SELECTION_REQUIRED'],
    [{ client_bet_id: 'bad-id' }, 'BET_REQUEST_CONFLICT'],
  ]) {
    const res = response()
    await handler({ method: 'POST', body: { ...valid, ...change } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(res.body.code, expected)
  }
  assert.equal(calls.length, 0)
})

test('bet RPC errors retain actionable reasons without exposing server internals', async () => {
  for (const [message, code, status] of [
    ['This Match has expired', 'BET_CLOSED', 400],
    ['You do not have enough MMK to complete this bet', 'BET_INSUFFICIENT_BALANCE', 400],
    ['Duplicate bet id', 'BET_REQUEST_CONFLICT', 409],
    ['Odds changed', 'BET_ODDS_CHANGED', 409],
    ['private database diagnostic', 'SUBMISSION_UNCONFIRMED', 500],
  ]) {
    const { handler } = fixture('pages/api/place-bet.js', { error: { message } })
    const res = response()
    await handler({ method: 'POST', body: { match_id: 'match-1', picked: 'nilnil', stake: 2500, expected_odd: 1.5 } }, res)
    assert.equal(res.statusCode, status)
    assert.equal(res.body.code, code)
    assert.doesNotMatch(res.body.message, /private database/)
  }
})
const id = '00000000-0000-4000-8000-000000000001'
const requestId = '00000000-0000-4000-8000-000000000002'
function fixture(file, outcome = { data: { status: 'success', notificationId: 1, balance: 50000 } }, authenticated = true) {
  const calls = []
  const handler = load(file, {
    '@/lib/apiAuth': { getCurrentUser: async () => { if (!authenticated) throw Object.assign(new Error('Authentication required'), { statusCode:401 }); return { id } } },
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async (name,args) => { calls.push({ name,args }); return outcome } }) },
  }).default
  return { calls, handler }
}

test('withdrawal is one atomic RPC, binds identity to Auth and preserves native response shape', async () => {
  const { calls,handler }=fixture('pages/api/withdraw.js'); const res=response()
  await handler({ method:'POST',url:'/api/withdraw',body:{ userid:'forged',amount:50000,pass:'1234',wallet:'owned',client_request_id:requestId,expectedFeePercent:7 } },res)
  assert.equal(res.statusCode,200); assert.equal(res.body[0].status,'Success')
  assert.equal(calls.length,1); assert.equal(calls[0].args.p_userid,id); assert.equal(calls[0].args.p_request_id,requestId)
  assert.match(res.headers['Server-Timing'],/database;dur=/)
})

test('failed or unauthenticated withdrawals never return success', async () => {
  for (const [authenticated,outcome,code] of [[false,{},401],[true,{error:{code:'P0001',message:'Wrong password'}},200],[true,{error:{code:'P0001',message:'A pending payment request already exists'}},200]]) {
    const {handler,calls}=fixture('pages/api/withdraw.js',outcome,authenticated);const res=response()
    await handler({method:'POST',body:{amount:50000,pass:'0000',wallet:'owned'}},res)
    assert.equal(res.statusCode,code);assert.equal(res.body[0].status,'Failed')
    if(!authenticated)assert.equal(calls.length,0)
  }
})

test('deposit rejects foreign receipt ownership and forwards a stable attempt id', async () => {
  const old=process.env.NEXT_PUBLIC_SUPABASE_URL;process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
  try {
    const {handler,calls}=fixture('pages/api/create-deposit.js');
    const body={amount:5,method:'usdt',methodName:'USDT',adminaddress:'destination',client_request_id:requestId}
    let res=response();await handler({method:'POST',body:{...body,address:'https://example.supabase.co/storage/v1/object/public/trcreceipt/web/other/receipt.webp'}},res)
    assert.equal(res.statusCode,400);assert.equal(calls.length,0)
    res=response();await handler({method:'POST',body:{...body,address:`https://example.supabase.co/storage/v1/object/public/trcreceipt/web/${id}/receipt.webp`}},res)
    assert.equal(res.statusCode,200);assert.equal(calls.length,1);assert.equal(calls[0].args.p_request_id,requestId)
  } finally { if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=old }
})

test('verified claims accelerate reads with trailing-slash configuration while every mutation freshly checks Auth', async () => {
  const old=process.env.NEXT_PUBLIC_SUPABASE_URL;process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co/'
  let claims=0,users=0
  try {
    const auth=load('lib/apiAuth.js',{'./supabaseAdmin':{getSupabaseAdmin:()=>({auth:{
      getClaims:async()=>{claims++;return {data:{claims:{sub:id,role:'authenticated',iss:'https://example.supabase.co/auth/v1'}}}},
      getUser:async()=>{users++;return {data:{user:{id}}}},
    }})}})
    assert.equal((await auth.getCurrentUser({method:'GET',headers:{authorization:'Bearer token'}})).id,id)
    assert.equal((await auth.getCurrentUser({method:'POST',headers:{authorization:'Bearer token'}})).id,id)
    assert.equal(claims,1);assert.equal(users,1)
    await assert.rejects(auth.getCurrentUser({method:'POST',headers:{}}),/Authentication required/)
  } finally { if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=old }
})

test('read authorization rejects service-role claims and another project issuer', async () => {
  const old=process.env.NEXT_PUBLIC_SUPABASE_URL;process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
  try {
    for(const claims of [{sub:id,role:'service_role',iss:'https://example.supabase.co/auth/v1'},{sub:id,role:'authenticated',iss:'https://other.supabase.co/auth/v1'}]) {
      const auth=load('lib/apiAuth.js',{'./supabaseAdmin':{getSupabaseAdmin:()=>({auth:{getClaims:async()=>({data:{claims}})}})}})
      await assert.rejects(auth.getCurrentUser({method:'GET',headers:{authorization:'Bearer token'}}),/Invalid or expired session/)
    }
  } finally { if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=old }
})

test('username login uses one SDK-compatible proxy request; email and refresh stay on Auth', async () => {
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/authTransport.js'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const calls=[],module={exports:{}}
  new Function('require','module','exports','window','fetch',code)(()=>{},module,module.exports,{},async(url,options)=>{calls.push({url,options});return new Response('{}')})
  const transport=module.exports.createAuthTransport('https://example.supabase.co/')
  await transport('https://example.supabase.co/auth/v1/token?grant_type=password',{body:JSON.stringify({email:'username',password:'test'})})
  assert.equal(calls[0].url,'/api/login');assert.deepEqual(JSON.parse(calls[0].options.body),{identity:'username',password:'test'})
  await transport('https://example.supabase.co/auth/v1/token?grant_type=password',{body:JSON.stringify({email:'user@example.invalid',password:'test'})})
  assert.match(calls[1].url,/supabase.co\/auth/)
  await transport('https://example.supabase.co/auth/v1/token?grant_type=refresh_token',{body:'{}'})
  assert.match(calls[2].url,/refresh_token/)
})
