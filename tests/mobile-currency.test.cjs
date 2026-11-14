const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function apiFixture(tokens) {
 let observed=0, headers
 const mocks={
  './config.js':{mobileConfig:{apiBaseUrl:'https://example.invalid/'}},
  './supabase.js':{getAccessToken:async()=>tokens.length>1?tokens.shift():tokens[0]},
  '../../../lib/accountCurrencyClient':{readAccountCurrency:()=>{observed++;return true},needsAccountCurrency:()=>true},
 }
 const source=fs.readFileSync(path.join(__dirname,'../mobile/src/lib/api.js'),'utf8')
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const moduleObj={exports:{}}
 new Function('require','module','exports','fetch',output)(id=>mocks[id],moduleObj,moduleObj.exports,async(_url,options)=>{
  headers=options.headers
  return {ok:true,status:200,json:async()=>({status:'success',currency:{code:'USDT',contract:1}})}
 })
 return {api:moduleObj.exports.apiFetch,observed:()=>observed,headers:()=>headers}
}
test('mobile requests opt into account currency and consume a response owned by the same session',async()=>{
 const f=apiFixture(['token-a'])
 await f.api('/api/me',{auth:true})
 assert.equal(f.headers()['x-account-currency-contract'],'1')
 assert.equal(f.observed(),1)
})
test('a response from a previous mobile session cannot overwrite the account currency',async()=>{
 const f=apiFixture(['token-a','token-b'])
 await assert.rejects(f.api('/api/me',{auth:true}),error=>error.status===401)
 assert.equal(f.observed(),0)
})
