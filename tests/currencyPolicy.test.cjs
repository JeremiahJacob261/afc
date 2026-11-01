const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/currencyPolicy.js'), 'utf8')
const moduleObj = { exports: {} }
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleObj, moduleObj.exports)
const { currencyForCountry, convertCurrency } = moduleObj.exports

test('maps signup countries to their currencies', () => {
  assert.equal(currencyForCountry('mm'), 'MMK')
  assert.equal(currencyForCountry('ZM'), 'ZMW')
  for (const code of ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG', 'CM', 'CF', 'TD', 'CG', 'GQ', 'GA']) assert.equal(currencyForCountry(code), 'FCFA')
  assert.equal(currencyForCountry('US'), 'USDT')
})
test('converts using the specified fixed rates', () => {
  assert.equal(convertCurrency(5000, 'MMK', 'USDT'), 1)
  assert.equal(convertCurrency(1, 'USDT', 'FCFA'), 600)
  assert.equal(convertCurrency(20, 'ZMW', 'MMK'), 5000)
  assert.equal(convertCurrency(1, 'UNKNOWN', 'USDT'), null)
})
