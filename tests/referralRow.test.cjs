const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const filename = path.resolve(__dirname, '../pages/user/refferal.js')
const source = fs.readFileSync(filename, 'utf8')
const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX)
const functionNames = new Set(['money', 'formatJoinedAt', 'ReferralRow'])
const functions = parsed.statements
  .filter(statement => ts.isFunctionDeclaration(statement) && functionNames.has(statement.name?.text))
  .map(statement => statement.getText(parsed))
const compiled = ts.transpileModule(functions.join('\n'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText
const ReferralRow = new Function('React', 'Box', 'Stack', 'Typography', 'Image', 'Rd', `${compiled}; return ReferralRow`)(
  require('react'), 'div', 'div', 'span', 'img', '/rounds.png'
)

function collectText(node, result = []) {
  if (typeof node === 'string' || typeof node === 'number') result.push(String(node))
  else if (Array.isArray(node)) node.forEach(child => collectText(child, result))
  else if (node && typeof node === 'object' && node.props) collectText(node.props.children, result)
  return result
}

test('a populated referral row renders its join date in the requested locale', () => {
  const row = ReferralRow({
    item: { username: 'member-42', level: 1, levelLabel: 'Level 1', joinedAt: '2026-01-02T12:00:00.000Z', totald: 0 },
    locale: 'en-US',
    t: key => key === 'website.dateUnavailable' ? 'Date unavailable' : key,
  })

  const text = collectText(row).join(' ')
  assert.match(text, /member-42/)
  assert.match(text, /Level 1/)
  assert.match(text, /2026/)
})

test('a referral row keeps the translated fallback for missing or invalid join dates', () => {
  for (const joinedAt of [undefined, 'not-a-date']) {
    const row = ReferralRow({
      item: { username: 'member-42', level: 1, joinedAt, totald: 0 },
      locale: 'en-US',
      t: key => key === 'website.dateUnavailable' ? 'Date unavailable' : key,
    })

    assert.match(collectText(row).join(' '), /Date unavailable/)
  }
})
