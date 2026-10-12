const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../lib/vip.js'), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const loaded = { exports: {} }
new Function('module', 'exports', output)(loaded, loaded.exports)
const { calculateVipLevel, calculateVipProgress } = loaded.exports

test('VIP eligibility requires the new active direct downline count at every tier', () => {
  const requirements = [0, 5, 10, 15, 20, 25, 30]
  assert.equal(calculateVipLevel(2500000, 0), 1)
  for (let level = 2; level <= 7; level += 1) {
    const count = requirements[level - 1]
    assert.equal(calculateVipLevel(2500000, count - 1), level - 1)
    assert.equal(calculateVipLevel(2500000, count), level)
  }
})

test('deposit requirements still gate VIP eligibility', () => {
  const deposits = [50000, 100000, 250000, 500000, 1000000, 1500000, 2500000]
  for (let level = 2; level <= 7; level += 1) {
    const amount = deposits[level - 1]
    assert.equal(calculateVipLevel(amount - 1, 30), level - 1)
    assert.equal(calculateVipLevel(amount, 30), level)
  }
})

test('VIP progress reports the new targets and caps completed progress', () => {
  assert.equal(calculateVipProgress(50000, 0).referralProgress, 100)
  for (let level = 2; level <= 7; level += 1) {
    const target = (level - 1) * 5
    const progress = calculateVipProgress(2500000, target / 2, level)
    assert.equal(progress.referralLimit, target)
    assert.equal(progress.referralProgress, 50)
    assert.equal(calculateVipProgress(2500000, target + 1, level).referralProgress, 100)
  }
})
