const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function load(file, mocks) {
 const src=fs.readFileSync(file,'utf8'), m={exports:{}}
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 new Function('require','module','exports',js)(id=>mocks[id]||{},m,m.exports);return m.exports
}
const rates={MMK:5000,USDT:1,FCFA:600,NGN:1350,ZMW:20}
const convertCurrency=(n,a,b)=>Number(n)/rates[a]*rates[b]
const currency={convertCurrency,accountCurrency:u=>u.currency_code}
function response(){return {statusCode:200,status(n){this.statusCode=n;return this},json(x){this.body=x;return this}}}
test('admin USD balance is converted to ledger units before saving',async()=>{
 let saved;const db={from:()=>({update:x=>({eq:async()=>{saved=x;return {error:null}}})})}
 const handler=load('pages/api/admin/user-action.js',{'@/lib/adminAuth':{requireAdmin(){}},'@/lib/supabaseAdmin':{getSupabaseAdmin:()=>db},'@/lib/currencyPolicy':currency}).default
 const res=response();await handler({method:'POST',body:{action:'update-balance',username:'test',newBalance:10,amountCurrency:'USD'}},res)
 assert.equal(res.statusCode,200);assert.equal(saved.balance,50000)
 saved = undefined
 const invalid=response();await handler({method:'POST',body:{action:'update-balance',username:'test',newBalance:null,amountCurrency:'USD'}},invalid)
 assert.equal(invalid.statusCode,400);assert.equal(saved,undefined)
})
test('FCFA reward is converted based on verified recipient currency',async()=>{
 let amount;const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{currency_code:'FCFA'}})})})})}
 const handler=load('pages/api/reward.js',{'@/lib/adminAuth':{requireAdmin(){}},'@/lib/supabaseAdmin':{getSupabaseAdmin:()=>db},'@/lib/currencyPolicy':currency,'@/lib/serverRpc':{callInternalRpc:async(_r,_n,p)=>{amount=p.amount}},'./supabase':{supabase:{}}}).default
 const res=response();await handler({body:{reward:6000,amountCurrency:'FCFA',id:'test',password:'password',checked:false}},res)
 assert.equal(res.statusCode,200);assert.equal(amount,50000)
 const bad=response();await handler({body:{reward:6000,amountCurrency:'NGN',id:'test',password:'password',checked:false}},bad);assert.equal(bad.statusCode,400)
})
