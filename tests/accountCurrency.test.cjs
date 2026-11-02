const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function load(name, mocks = {}) {
 const filename = path.resolve(__dirname, '..', name)
 const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 const loaded = { exports: {} }
 new Function('require', 'module', 'exports', output)(id => {
  if (Object.hasOwn(mocks, id)) return mocks[id]
  return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), id.endsWith('.js') ? id : id + '.js')), mocks)
 }, loaded, loaded.exports)
 return loaded.exports
}
const policy = load('lib/currencyPolicy.js')
const auth = { getCurrentProfile: async req => ({ profile: req.profile }), sendApiError: (_res, err) => { throw err } }
const { accountPayload, withAccountCurrency } = load('lib/accountCurrencyApi.js', { './apiAuth.js': auth })

test('existing MMK accounts resolve by country at fixed value', () => {
 for (const [countrycode, code] of [['+95','MMK'],['+260','ZMW'],['+225','FCFA'],['+237','FCFA'],['+1','USDT']]) {
  assert.equal(policy.accountCurrency({countrycode}),code)
  assert.equal(accountPayload({balance:5000}, code).balance, policy.CURRENCY_RATES[code])
 }
 assert.equal(policy.accountCurrency({country_iso:'ZM',countrycode:'+95'}),'ZMW')
})
test('ledger amounts convert while payment amounts, odds, counts, rates and percentages stay intact', () => {
 const result = accountPayload({ profile:{balance:50000,totald:100000}, vip:{depositLimit:250000,depositProgress:40},
  methods:[{rates:600}], odd:12.5, feePercent:7, count:3,
  transactions:[{type:'deposit',amount:3000,primaryAmount:{value:3000,currency:'FCFA'},secondaryAmount:{value:25000,currency:'MMK'}}],
  messageValues:{amount:'25,000 MMK',method:'MMK'},
 },'ZMW')
 assert.deepEqual(result.profile,{balance:200,totald:400})
 assert.deepEqual(result.vip,{depositLimit:1000,depositProgress:40})
 assert.equal(result.methods[0].rates,600)
 assert.equal(result.odd,12.5)
 assert.equal(result.feePercent,7)
 assert.equal(result.count,3)
 assert.equal(result.transactions[0].amount,3000)
 assert.deepEqual(result.transactions[0].primaryAmount,{value:3000,currency:'FCFA'})
 assert.equal(result.transactions[0].secondaryAmount.value,100)
 assert.equal(result.transactions[0].secondaryAmount.currency,'ZMW')
 assert.deepEqual(result.messageValues,{amount:'100 ZMW',method:'MMK'})
})
for (const [countrycode, code, input, expected] of [['+1','USDT',0.5,2500],['+260','ZMW',10,2500],['+225','FCFA',300,2500],['+95','MMK',2500,2500]]) {
 test(`bet requests and results round trip in ${code}`,async()=>{
  const req={url:'/api/place-bet',headers:{'x-account-currency-contract':'1'},profile:{countrycode},body:{stake:input},method:'POST'}
  let payload
  const res={json:body=>{payload=body;return body}}
  await withAccountCurrency(async (r,s)=>{assert.equal(r.body.stake,expected);s.json({balance:5000,stake:expected})})(req,res)
  assert.equal(payload.balance,policy.CURRENCY_RATES[code])
  assert.equal(payload.stake,input)
  assert.equal(payload.currency.code,code)
 })
}
test('legacy clients retain the MMK contract',async()=>{
 const req={url:'/api/place-bet',headers:{},body:{stake:2500}}
 await withAccountCurrency(async r=>assert.equal(r.body.stake,2500))(req,{})
})
test('withdrawal quote input converts but deposit input stays in the payment currency',async()=>{
 for(const route of ['withdrawal','deposit']) {
  const req={url:`/api/mobile/${route}-quote`,headers:{'x-account-currency-contract':'1'},profile:{countrycode:'+260'},query:{amount:'100'}}
  await withAccountCurrency(async r=>assert.equal(Number(r.query.amount),route==='withdrawal'?25000:100))(req,{json:x=>x})
 }
})

test('transaction notifications distinguish submitted payment currency from account withdrawal currency', () => {
 const messageKey = 'mobile.notifications.messages.transactionUpdate'
 const deposit = accountPayload({type:'deposit',amount:25000,message:'Your deposit of 25000 MMK is pending',messageKey,messageValues:{amount:'25000',method:'MMK'}},'USDT')
 assert.equal(deposit.messageValues.amount,'25000')
 assert.equal(deposit.messageValues.method,'MMK')
 assert.equal(deposit.message,'Your deposit of 25000 MMK is pending')
 const withdrawal = accountPayload({type:'withdraw',amount:25000,messageKey,messageValues:{amount:'25000',method:'MMK'}},'USDT')
 assert.equal(withdrawal.amount,5)
 assert.deepEqual(withdrawal.messageValues,{amount:5,method:'USDT'})
})

test('settlement event templates receive account amounts, while payment events preserve method amounts', () => {
 const bet = accountPayload({type:'bet_settled',category:'bet',messageKey:'mobile.notifications.events.bet_settled.message',messageValues:{stake:5000,payout:6000,home:'A',away:'B'}},'ZMW')
 assert.deepEqual(bet.messageValues,{stake:20,payout:24,home:'A',away:'B'})
 const payment = accountPayload({type:'deposit_approved',category:'deposit',amount:25000,message:'Your deposit of 25000 MMK was approved.',messageKey:'mobile.notifications.events.deposit_approved.message',messageValues:{amount:25000,method:'MMK'}},'USDT')
 assert.equal(payment.amount,25000)
 assert.equal(payment.messageValues.amount,25000)
 assert.equal(payment.messageValues.method,'MMK')
})

test('history leads with the assigned account amount while retaining actual payment amounts', () => {
 for (const [code,amount] of [['USDT',5],['MMK',25000],['FCFA',3000],['ZMW',100]]) {
  const result=accountPayload({type:'deposit',accountingAmountMmk:25000,primaryAmount:{value:25000,currency:'MMK',labelKey:'mobile.transactions.submittedAmount'},secondaryAmount:{value:25000,currency:'MMK'}},code)
  assert.equal(result.primaryAmount.value,amount)
  assert.equal(result.primaryAmount.currency,code)
  assert.equal(result.secondaryAmount.value,25000)
  assert.equal(result.secondaryAmount.currency,'MMK')
 }
 const withdrawal=accountPayload({type:'withdraw',accountingAmountMmk:50000,primaryAmount:{value:10,currency:'USDT',labelKey:'mobile.transactions.payoutAmount'}},'USDT')
 assert.equal(withdrawal.primaryAmount.value,10)
 assert.equal(withdrawal.secondaryAmount.value,10)
})
