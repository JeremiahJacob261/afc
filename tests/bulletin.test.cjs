const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { createRequire } = require('node:module')
function load(name) {
  const filename = path.resolve(__dirname, '../lib', name + '.js')
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }, realRequire = createRequire(filename)
  const require = (id) => id === './matchDisplay' ? load('matchDisplay') : realRequire(id)
  new Function('require', 'module', 'exports', source)(require, module, module.exports)
  return module.exports
}
test('upcoming fixtures match server eligibility and cached kickoff is excluded', () => {
  const { upcomingFixtures } = load('fixtureDisplay')
  const now = 1893456000000
  const fixtures = [{ match_id: 'later', tsgmt: now + 2000, verified: false }, { match_id: 'past', tsgmt: now - 1, verified: false }, { match_id: 'kickoff', tsgmt: now, verified: false }, { match_id: 'settled', tsgmt: now + 500, verified: true }, { match_id: 'soon', tsgmt: now + 1000, verified: false }]
  assert.deepEqual(upcomingFixtures(fixtures, now).map((m) => m.match_id), ['soon', 'later'])
  assert.deepEqual(upcomingFixtures([], now), [])
})
test('refunds return only stake and explicit settlement overrides legacy won flag', () => {
  const { getBetOutcome, getBetState, getBetReturn } = load('betDisplay')
  const bet = { stake: '5000', profit: '35', aim: '5035', settlement_outcome: 'refunded', won: 'true', tsgmt: 1893456000000 }
  assert.equal(getBetOutcome(bet), 'refunded')
  assert.equal(getBetState(bet, 0), 'refunded')
  assert.equal(getBetReturn(bet), 5000)
  assert.equal(getBetReturn({ ...bet, settlement_outcome: 'won' }), 5035)
  assert.equal(getBetState({ won: 'false' }), 'lost')
})
