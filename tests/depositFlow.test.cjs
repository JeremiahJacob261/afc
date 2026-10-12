const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

function loadModule(relativePath, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relativePath)
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const loaded = { exports: {} }
  const requireActual = createRequire(filename)
  new Function('require', 'module', 'exports', output)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : requireActual(name), loaded, loaded.exports,
  )
  return loaded.exports
}

const currency = loadModule('lib/currency.js')
const paymentMethods = loadModule('lib/paymentMethods.js', { './currency': currency })
const flow = loadModule('lib/depositFlow.js', { './paymentMethods': paymentMethods })
const destinations = [
  { id: 'kpay', name: 'MMK', currency_code: 'MMK', bank: 'kpay', address: 'kpay-account' },
  { id: 'wave', name: 'MMK', currency_code: 'MMK', bank: 'Wave', address: 'wave-account' },
]

test('selecting an MMK provider needs no second provider choice and uses its own account', () => {
  for (const [name, id] of [['WAVE', 'wave'], ['Kpay', 'kpay']]) {
    const method = { id, name, currency_code: 'MMK', rates: 5000 }
    assert.equal(flow.needsTransferOption(destinations, method), false, name)
    assert.equal(flow.findDestination(destinations, method, '')?.id, id, name)
    assert.equal(flow.findDestination(destinations, method, id === 'wave' ? 'kpay' : 'wave')?.id, id,
      'a stale transfer choice must not switch providers')
  }
})

test('an MMK provider without its own active destination cannot use another provider', () => {
  const method = { name: 'WAVE', currency_code: 'MMK' }
  const otherProviderOnly = [destinations[0], { ...destinations[1], available: false }]
  assert.equal(flow.needsTransferOption(otherProviderOnly, method), false)
  assert.equal(flow.findDestination(otherProviderOnly, method, 'kpay'), null)
})

test('named destinations and separate USDT networks still resolve directly', () => {
  const rows = [
    { name: 'Kpay', currency_code: 'MMK', address: 'named-kpay' },
    { name: 'USDT (TRC20)', currency_code: 'USDT', address: 'trc20' },
    { name: 'USDT (BEP20)', currency_code: 'USDT', address: 'bep20' },
  ]
  for (const row of rows) {
    assert.equal(flow.needsTransferOption(rows, row), false)
    assert.equal(flow.findDestination(rows, row, ''), row)
  }
})

test('legacy currency-only methods retain their explicit transfer choice', () => {
  const method = { name: 'MMK', currency_code: 'MMK' }
  const rows = destinations.map(row => ({ ...row, name: '' }))
  assert.equal(flow.needsTransferOption(rows, method), true)
  assert.equal(flow.findDestination(rows, method, ''), null)
  assert.equal(flow.findDestination(rows, method, 'wave')?.id, 'wave')
})
