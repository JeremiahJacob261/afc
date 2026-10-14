const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')
const i18next = require('i18next')
const en = require('../locales/en/common.json')
const my = require('../locales/my/common.json')

// Exercise the production module, transpiling its Next.js ESM syntax for Node.
const filename = path.resolve(__dirname, '../lib/translateApiMessage.js')
const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const loaded = { exports: {} }
new Function('require', 'module', 'exports', output)(createRequire(filename), loaded, loaded.exports)
const { translateApiMessage } = loaded.exports

test('bet rejections explain the specific cause instead of the generic fallback', async () => {
  const instance = await translator('en')
  assert.equal(translateApiMessage('This bet has expired', instance.t, 'messages.unablePlaceBet'), instance.t('mobile.match.matchExpired'))
  assert.equal(translateApiMessage('Match not found', instance.t, 'messages.unablePlaceBet'), instance.t('messages.matchNotFound'))
  assert.equal(translateApiMessage('Invalid or expired session', instance.t, 'messages.unablePlaceBet'), instance.t('messages.sessionExpired'))
})

test('bet stake and service errors never acquire an unrelated withdrawal explanation', async () => {
  const instance = await translator('en')
  const minimum = translateApiMessage('Minimum stake is 3,000 MMK', instance.t, 'messages.unablePlaceBet')
  assert.match(minimum, /stake/i)
  assert.match(minimum, /3,000/)
  assert.doesNotMatch(translateApiMessage('Service temporarily unavailable', instance.t, 'messages.unablePlaceBet'), /withdrawal/i)
})

test('structured bet reasons are localized and preserve safe structured amounts', async () => {
  for (const language of ['en', 'my']) {
    const instance = await translator(language)
    assert.equal(translateApiMessage({ code: 'BET_MINIMUM_STAKE', details: { minimum: '2,500 MMK' } }, instance.t, 'messages.unablePlaceBet'), instance.t('messages.betMinimum', { minimum: '2,500 MMK' }))
    assert.equal(translateApiMessage({ code: 'BET_INVALID_DETAILS' }, instance.t, 'messages.unablePlaceBet'), instance.t('messages.betInvalidDetails'))
    assert.equal(translateApiMessage({ status: 409, message: 'Unknown conflict' }, instance.t, 'messages.unablePlaceBet'), instance.t('messages.unablePlaceBet'))
    assert.equal(translateApiMessage({ status: 401 }, instance.t, 'messages.unablePlaceBet'), instance.t('messages.sessionExpired'))
  }
})

test('lost responses use outcome-check instructions even for exact dictionary matches', async () => {
  const instance = await translator('en')
  for (const fallback of ['messages.unablePlaceBet', 'messages.depositFailed', 'messages.unableSubmitWithdrawal', 'messages.unableSetPin', 'messages.unableBindWallet']) {
    assert.equal(translateApiMessage(new Error('Network error'), instance.t, fallback), instance.t(fallback))
  }
  assert.equal(translateApiMessage({ status: 400, payload: { code: 'BET_CLOSED', message: 'legacy' } }, instance.t, 'messages.unablePlaceBet'), instance.t('mobile.match.matchExpired'))
})

test('dashboard date filters work without component translation state', () => {
  const dashboard = fs.readFileSync(path.resolve(__dirname, '../pages/user/index.js'), 'utf8')
  const source = ts.createSourceFile('dashboard.js', dashboard, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX)
  const helpers = source.statements.filter((statement) => ts.isFunctionDeclaration(statement)
    && ['localDateKey', 'filteredMatches'].includes(statement.name?.text)).map((statement) => statement.getText(source)).join('\n')
  const { localDateKey, filteredMatches } = new Function('getMatchStartMs', `const HOUR_MS = 3600000; ${helpers}; return { localDateKey, filteredMatches }`)((match) => match.tsgmt)
  const now = new Date(2026, 9, 8, 23, 0).getTime()
  const today = { tsgmt: new Date(2026, 9, 8, 23, 30).getTime() }
  const tomorrow = { tsgmt: new Date(2026, 9, 9, 0, 30).getTime() }
  assert.equal(localDateKey(new Date(now)), '2026-10-08')
  assert.deepEqual(filteredMatches([tomorrow, today], 'today', now), [today])
  assert.deepEqual(filteredMatches([tomorrow, today], 'tomorrow', now), [tomorrow])
  assert.deepEqual(filteredMatches([tomorrow, today], 'next3h', now), [today, tomorrow])
})

async function translator(language) {
  const instance = i18next.createInstance()
  await instance.init({ lng: language, fallbackLng: 'en', resources: { en: { common: en }, my: { common: my } }, defaultNS: 'common', interpolation: { escapeValue: false } })
  return instance
}

test('payment errors follow the selected language and preserve server limits', async () => {
  const instance = await translator('my')
  assert.equal(translateApiMessage('Maximum amount to withdraw is 123,456 MMK', instance.t), instance.t('mobile.withdraw.maximumWithdrawal', { amount: '123,456' }))
  assert.equal(translateApiMessage('Minimum deposit is 25,000 MMK equivalent', instance.t), instance.t('messages.minimumDeposit', { amount: '25,000', currency: 'MMK' }))
  await instance.changeLanguage('en')
  assert.equal(translateApiMessage('Maximum amount to withdraw is 123,456 MMK', instance.t), 'Maximum withdrawal is 123,456 MMK.')
})

test('withdrawal instructions retain both required and completed bet counts', async () => {
  const instance = await translator('my')
  const result = translateApiMessage('You need to place 6 bets after your latest successful deposit before withdrawing. You have placed 3.', instance.t)
  assert.equal(result, instance.t('mobile.withdraw.betRequirementWithCount', { required: 6, placed: 3 }))
})

test('structured error codes override English text and unknown errors stay localized', async () => {
  const instance = await translator('my')
  assert.equal(translateApiMessage({ code: 'PAYMENT_REQUEST_PENDING', message: 'Something from the server' }, instance.t), instance.t('messages.paymentRequestPending'))
  assert.equal(translateApiMessage({ code: 'auth/invalid-email', message: 'Firebase (auth/invalid-email)' }, instance.t), instance.t('messages.invalidEmailMessage'))
  assert.equal(translateApiMessage('Database internal error details', instance.t, 'messages.depositFailed'), instance.t('messages.depositFailed'))
  assert.equal(translateApiMessage(instance.t('messages.receiptAlreadyUsed'), instance.t), instance.t('messages.receiptAlreadyUsed'))
})

test('insufficient funds always names the MMK ledger in both languages', async () => {
  for (const language of ['en', 'my']) {
    const instance = await translator(language)
    const result = translateApiMessage('Insufficient funds', instance.t)
    assert.match(result, /MMK/)
    assert.doesNotMatch(result, /FCFA/)
  }
})

test('Burmese push notifications use Burmese templates and settlement outcomes', async () => {
  const pushFile = path.resolve(__dirname, '../lib/pushNotifications.js')
  const compiled = ts.transpileModule(fs.readFileSync(pushFile, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const push = { exports: {} }
  new Function('require', 'module', 'exports', compiled)(createRequire(pushFile), push, push.exports)
  const notification = push.exports.localizedPushMessage({
    title: 'Bet settled', body: 'English fallback',
    data: { eventType: 'bet_settled', home: 'A', away: 'B', outcomeKey: 'status.refunded' },
  }, 'my')
  const instance = await translator('my')
  assert.equal(notification.title, my.mobile.notifications.events.bet_settled.title)
  assert.equal(notification.body, instance.t('mobile.notifications.events.bet_settled.message', {
    home: 'A', away: 'B', outcome: instance.t('status.refunded'),
  }))
})
