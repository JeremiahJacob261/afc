const { test } = require('node:test')
const assert = require('node:assert/strict')
const { defaultCurrencyLimits, validateCurrencyLimits } = require('../lib/withdrawalCurrencyLimits.cjs')
const fs = require('node:fs')
const ts = require('typescript')

test('initial currency limits preserve the existing MMK value', () => {
  const limits = defaultCurrencyLimits({ minWithdrawalAmount: 50000, maxWithdrawalAmount: 500000, dailyWithdrawalLimit: 500000, annualWithdrawalLimit: 500000000 })
  assert.deepEqual(limits.USDT, { minimum: 10, perRequest: 100, daily: 100, annual: 100000 })
  assert.equal(limits.FCFA.minimum, 6000)
  assert.equal(limits.ZMW.minimum, 200)
  assert.deepEqual(validateCurrencyLimits(limits), limits)
})

test('each currency is independently validated', () => {
  const limits = defaultCurrencyLimits({ minWithdrawalAmount: 50000, maxWithdrawalAmount: 500000, dailyWithdrawalLimit: 500000, annualWithdrawalLimit: 500000000 })
  limits.ZMW.minimum = 300
  assert.equal(validateCurrencyLimits(limits).ZMW.minimum, 300)
  limits.FCFA.daily = -1
  assert.throws(() => validateCurrencyLimits(limits), /FCFA daily/)
  delete limits.MMK
  assert.throws(() => validateCurrencyLimits(limits), /Missing withdrawal limits for MMK/)
})

test('payment state selects the verified profile currency and retains the legacy ledger contract', async () => {
  const limits = defaultCurrencyLimits({ minWithdrawalAmount: 50000, maxWithdrawalAmount: 500000, dailyWithdrawalLimit: 500000, annualWithdrawalLimit: 500000000 })
  limits.USDT = { minimum: 20, perRequest: 40, daily: 30, annual: 35 }
  const stubs = {
    './withdrawalCurrencyLimits.cjs': require('../lib/withdrawalCurrencyLimits.cjs'),
    './apiAuth': { getCurrentUser: async () => ({ id: 'verified' }) },
    './supabaseAdmin': { getSupabaseAdmin: () => ({}) },
    './apiTiming': { timedRpc: async (_req, _db, _name, args) => {
      assert.equal(args.p_userid, 'verified')
      return { data: { profile: { currency_code: 'USDT' }, settings: {} } }
    } },
    './adminSettings': { normalizeWithdrawalSettings: () => ({ currencyLimits: limits }) },
    './currency': { normalizeCurrencySettings: () => ({}) },
  }
  const source = fs.readFileSync(require.resolve('../lib/paymentState.js'), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const moduleObj = { exports: {} }
  new Function('require', 'module', 'exports', js)(id => stubs[id], moduleObj, moduleObj.exports)
  const result = await moduleObj.exports.readPaymentState({})
  assert.deepEqual(result.settings, { minWithdrawalAmount: 100000, maxWithdrawalAmount: 200000, dailyWithdrawalLimit: 150000, annualWithdrawalLimit: 175000 })
})

test('admin save validates all currencies and stores the MMK compatibility fields', async () => {
  const source = fs.readFileSync(require.resolve('../lib/adminSettings.js'), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const moduleObj = { exports: {} }
  const mocks = {
    './withdrawalCurrencyLimits.cjs': require('../lib/withdrawalCurrencyLimits.cjs'),
    './membership': { DEFAULT_MEMBERSHIP_BALANCE_THRESHOLD: 0, normalizeMembershipBalanceThreshold: Number },
  }
  new Function('require', 'module', 'exports', js)(id => mocks[id], moduleObj, moduleObj.exports)
  let saved
  const database = { from: () => ({ upsert: row => {
    saved = row
    return { select: () => ({ single: async () => ({ data: row }) }) }
  } }) }
  const limits = defaultCurrencyLimits({ minWithdrawalAmount: 50000, maxWithdrawalAmount: 500000, dailyWithdrawalLimit: 500000, annualWithdrawalLimit: 500000000 })
  limits.MMK = { minimum: '60000', perRequest: '700000', daily: '900000', annual: '600000000' }
  limits.USDT.minimum = '20'
  const result = await moduleObj.exports.saveWithdrawalSettings(database, { currencyLimits: limits })
  assert.equal(saved.min_withdrawal_amount, 60000)
  assert.equal(saved.daily_withdrawal_limit, 900000)
  assert.equal(saved.withdrawal_currency_limits.USDT.minimum, 20)
  assert.equal(result.currencyLimits.MMK.perRequest, 700000)
  limits.FCFA.daily = ''
  await assert.rejects(moduleObj.exports.saveWithdrawalSettings(database, { currencyLimits: limits }), /FCFA daily/)
})
