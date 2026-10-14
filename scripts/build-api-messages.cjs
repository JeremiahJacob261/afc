const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const normalize = value => value.trim().toLowerCase().replace(/[.!]+$/, '')
const messages = {}
function collect(value, prefix) {
  for (const [name, entry] of Object.entries(value || {})) {
    const key = `${prefix}.${name}`
    if (entry && typeof entry === 'object') collect(entry, key)
    else if (typeof entry === 'string' && !entry.includes('{{')) messages[normalize(entry)] = key
  }
}
for (const locale of ['en','my']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'locales',locale,'common.json')))
  for (const section of ['common','messages','status']) collect(data[section], section)
  for (const section of ['match','withdraw','deposit','transactions']) collect(data.mobile?.[section], `mobile.${section}`)
}
fs.writeFileSync(path.join(root, 'locales','api-messages.json'), JSON.stringify(messages)+'\n')
