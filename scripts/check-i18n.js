const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { i18n } = require('../next-i18next.config')

const root = path.resolve(__dirname, '..')
const catalogs = Object.fromEntries(i18n.locales.map((locale) => [locale,
  JSON.parse(fs.readFileSync(path.join(root, 'locales', locale, 'common.json'), 'utf8')),
]))

function flatten(value, prefix = '', result = {}) {
  for (const [name, entry] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${name}` : name
    if (entry && typeof entry === 'object') flatten(entry, key, result)
    else result[key] = entry
  }
  return result
}

const base = flatten(catalogs.en)
for (const [locale, catalog] of Object.entries(catalogs)) {
  const entries = flatten(catalog)
  assert.deepEqual(Object.keys(entries).sort(), Object.keys(base).sort(), `${locale}: catalog keys differ`)
  for (const [key, value] of Object.entries(entries)) {
    assert.equal(typeof value, typeof base[key], `${locale}: ${key} has the wrong type`)
    if (typeof value !== 'string') continue
    assert.ok(value.trim(), `${locale}: ${key} is empty`)
    const placeholders = (text) => [...text.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort()
    assert.deepEqual(placeholders(value), placeholders(base[key]), `${locale}: ${key} interpolation differs`)
  }
}

let references = 0
const translatedScreens = new Set([
  'components/ucl/LandingPage.jsx', 'components/ucl/FootballSections.jsx', 'components/ucl/LandingClosing.jsx',
  'pages/user/cover.js', 'pages/user/index.js', 'pages/user/matches.js', 'pages/user/vip.js',
  'pages/user/wheel.js', 'pages/user/faq.js', 'pages/user/depositsuccess.js', 'pages/user/withdrawsuccess.js',
])
const brandText = new Set(['UCL', 'VIP', 'MMK', 'USDT', 'VS', 'V', 'Telegram', 'WhatsApp', 'UCL —', '— UCL'])
function hasKey(catalog, key) {
  return key.split('.').reduce((entry, name) => entry?.[name], catalog) !== undefined
}
function checkKeys(argument, source) {
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      assert.ok(hasKey(catalog, argument.text), `${source.fileName}: ${locale} missing ${argument.text}`)
    }
    references++
  } else if (ts.isConditionalExpression(argument)) {
    checkKeys(argument.whenTrue, source)
    checkKeys(argument.whenFalse, source)
  }
}
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) scan(file)
    else if (/\.[jt]sx?$/.test(file)) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
        /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.JSX)
      function visit(node) {
        if (translatedScreens.has(path.relative(root, file).replace(/\\/g, '/')) && ts.isJsxText(node)) {
          const text = node.text.replace(/\s+/g, ' ').trim()
          assert.ok(!/[A-Za-z]/.test(text) || brandText.has(text), `${file}: untranslated visible text ${JSON.stringify(text)}`)
        }
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments[0]) {
          checkKeys(node.arguments[0], source)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
}
for (const directory of ['pages', 'components', 'lib', 'mobile/src']) scan(path.join(root, directory))
console.log(`Translation checks passed: ${i18n.locales.join(', ')}, ${Object.keys(base).length} entries, ${references} literal references.`)
