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
const wheel = loadModule('lib/wheel.js', { './currency': currency })
const amounts = [50000, 5000, 20000, 100000, 10, 500, 1000, 30000]
const items = amounts.map((amount, index) => ({ id: String(index), amount, label: currency.formatCurrency(amount, null, 'en') }))

function apiFixture({ balance = 100000, state = null, outcome, prizeIndex = 0, pushFails = false, authFails = false } = {}) {
  const calls = []
  const supabase = {
    async rpc(name, parameters) {
      calls.push({ name, parameters })
      return { data: name === 'read_wheel_configuration' ? { revision: 3, items } : outcome, error: null }
    },
    from(name) {
      assert.equal(name, 'wheel_spin_state')
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state, error: null }) }
      return query
    },
  }
  const handler = loadModule('pages/api/wheel-spin.js', {
    'node:crypto': { randomInt: count => { assert.equal(count, items.length); return prizeIndex } },
    '@/lib/apiAuth': {
      getCurrentProfile: async () => {
        if (authFails) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
        return { user: { id: 'session-user' }, profile: { balance }, supabase }
      },
      sendApiError: (res, error) => res.status(error.statusCode || 500).json({ status: 'error', message: error.message }),
    },
    '@/lib/wheel': wheel,
    '@/lib/pushNotifications': {
      sendPushToUsername: async (_db, username, message) => {
        calls.push({ name: 'push', username, message })
        if (pushFails) throw new Error('Delivery unavailable')
      },
    },
  }).default
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value }, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
  return { handler, response, calls }
}

test('the $20 threshold uses the platform accounting rate and whole-MMK validation', () => {
  assert.equal(wheel.WHEEL_MINIMUM_BALANCE, 100000)
  for (const value of [10, '500', 99999999999]) assert.equal(wheel.isWheelAmount(value), true)
  for (const value of [0, -1, 1.5, '', '1e3', '1.5', null, true, {}, NaN, Infinity, 100000000000]) {
    assert.equal(wheel.isWheelAmount(value), false, String(value))
  }
})

test('GET gates below, at, and above the threshold and respects existing cooldowns', async () => {
  for (const balance of [99999.9999, 100000, 100001]) {
    const { handler, response } = apiFixture({ balance })
    await handler({ method: 'GET' }, response)
    assert.equal(response.code, 200)
    assert.equal(response.body.eligible, balance >= 100000)
    assert.equal(response.body.canSpin, balance >= 100000)
    assert.equal(response.body.minimumBalance, 100000)
  }
  const { handler, response } = apiFixture({ state: { spun_at: new Date().toISOString(), prize_index: 0, prize_label: 'iPhone 17', prize_amount: null } })
  await handler({ method: 'GET' }, response)
  assert.equal(response.body.canSpin, false)
  assert.equal(response.body.lastPrize, 'iPhone 17')
  assert.equal(response.body.lastAmount, null)
})

test('each server-selected prize returns its award and pushes only the committed notification', async () => {
  for (let prizeIndex = 0; prizeIndex < amounts.length; prizeIndex++) {
    const amount = amounts[prizeIndex]
    const outcome = {
      status: 'success', prizeIndex, amount, balance: 100000 + amount,
      notification: { id: 42, username: 'winner', title: 'Wheel reward', body: 'Award committed', data: { amount } },
    }
    const { handler, response, calls } = apiFixture({ outcome, prizeIndex })
    await handler({ method: 'POST', body: { revision: 3, amount: 999999, userId: 'forged' } }, response)
    assert.equal(response.code, 200)
    assert.equal(response.body.amount, amount)
    assert.equal(response.body.balance, 100000 + amount)
    assert.equal(response.body.notification, undefined)
    assert.deepEqual(calls[1], { name: 'spin_wheel_atomic', parameters: { p_user_id: 'session-user', p_expected_revision: 3, p_prize_index: prizeIndex } })
    assert.equal(calls[2].message.data.notificationId, 42)
    assert.equal(calls[2].message.data.eventType, 'wheel_reward')
  }
})

test('balance, cooldown, and revision rejections do not send push notifications', async () => {
  for (const [status, code] of [['insufficient_balance', 403], ['cooldown', 409], ['wheel_updated', 409]]) {
    const { handler, response, calls } = apiFixture({ outcome: { status, balance: 99999, minimumBalance: 100000 } })
    await handler({ method: 'POST', body: { revision: 3 } }, response)
    assert.equal(response.code, code)
    assert.equal(response.body.status, status)
    assert.equal(calls.some(call => call.name === 'push'), false)
  }
})

test('push delivery failure leaves a committed award successful', async () => {
  const { handler, response } = apiFixture({ pushFails: true, outcome: {
    status: 'success', amount: 500, balance: 100500,
    notification: { id: 4, username: 'winner', title: 'Wheel reward', body: 'Award committed', data: {} },
  } })
  await handler({ method: 'POST', body: { revision: 3 } }, response)
  assert.equal(response.code, 200)
  assert.equal(response.body.balance, 100500)
})

test('invalid requests and unauthenticated users cannot award a prize', async () => {
  for (const revision of [null, '3', 0, 1.5]) {
    const { handler, response, calls } = apiFixture()
    await handler({ method: 'POST', body: { revision } }, response)
    assert.equal(response.code, 400)
    assert.equal(calls.some(call => call.name === 'spin_wheel_atomic'), false)
  }
  const { handler, response, calls } = apiFixture({ authFails: true })
  await handler({ method: 'POST', body: { revision: 3 } }, response)
  assert.equal(response.code, 401)
  assert.deepEqual(calls, [])
})

test('admin amounts are required and labels are derived instead of trusted', () => {
  const { normalizeItems } = loadModule('pages/api/admin/wheel-items.js', {
    '@/lib/adminAuth': {}, '@/lib/supabaseAdmin': {}, '@/lib/currency': currency, '@/lib/wheel': wheel,
  })
  const input = [500, 1000].map(amount => ({ amount, label: 'iPhone', imageUrl: '/cash.png', color: '#ffffff' }))
  assert.deepEqual(normalizeItems(input).map(item => item.label), ['500 MMK', '1,000 MMK'])
  assert.throws(() => normalizeItems([{ ...input[0], amount: 1.5 }, input[1]]), /whole MMK/)
  assert.throws(() => normalizeItems([{ ...input[0], amount: undefined }, input[1]]), /whole MMK/)
})

test('the pointer aligns to every selected slice across repeated and reduced-motion spins', () => {
  for (const count of [2, 8, 12]) {
    let rotation = 0
    for (const reduced of [false, true]) for (let index = 0; index < count; index++) {
      const next = wheel.wheelRotation(rotation, index, count, reduced)
      assert.ok(next >= rotation)
      assert.ok(Math.abs(((next + index * 360 / count) % 360)) < 1e-8)
      if (!reduced) assert.ok(next - rotation >= 2160)
      rotation = next
    }
  }
})

test('wheel reward notifications localize their amount and MMK currency', () => {
  const { localizedPushMessage } = loadModule('lib/pushNotifications.js')
  for (const language of ['en', 'my']) {
    const message = localizedPushMessage({ data: { eventType: 'wheel_reward', amount: 5000 } }, language)
    assert.match(message.body, /5000\.00 MMK/)
    assert.equal(message.title, require(`../locales/${language}/common.json`).mobile.notifications.events.wheel_reward.title)
    if (language === 'my') {
      assert.match(message.title, /[\u1000-\u109f]/)
      assert.match(message.body, /[\u1000-\u109f]/)
    }
  }
})
