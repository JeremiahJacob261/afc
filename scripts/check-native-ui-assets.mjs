import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('android/native/app/src/main')
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(directory, item.name)) : [path.join(directory, item.name)])
}
const kotlin = files(path.join(root, 'java')).filter(file => file.endsWith('.kt'))
const copy = ['en', 'my'].map(language => [language, JSON.parse(fs.readFileSync(`locales/${language}/common.json`, 'utf8'))])
const keys = new Set(), iconNames = new Set(), failures = []
for (const file of kotlin) {
  const source = fs.readFileSync(file, 'utf8')
  for (const [, key] of source.matchAll(/"((?:website|mobile|common|forms|messages|emptyStates|status|landing)\.[a-zA-Z0-9_.]+)"/g)) keys.add(key)
  for (const [, icon] of source.matchAll(/WebIcon\("([a-z0-9_]+)"/g)) iconNames.add(icon)
}
for (const key of keys) {
  for (const [language, dictionary] of copy) {
    const value = key.split('.').reduce((node, part) => node?.[part], dictionary)
    const plural = key.split('.').slice(0, -1).reduce((node, part) => node?.[part], dictionary)?.[`${key.split('.').at(-1)}_other`]
    if (value === undefined && plural === undefined) failures.push(`${language}: missing ${key}`)
  }
}
for (const icon of iconNames) {
  if (!fs.existsSync(path.join(root, `res/drawable/web_${icon}.xml`))) failures.push(`Missing icon ${icon}`)
}
for (const asset of ['drawable-nodpi/dashboard_star_ball.webp', 'drawable-nodpi/deposit_stadium.webp', 'drawable-nodpi/web_ball.png', 'drawable-nodpi/web_referral_member.png', 'drawable-nodpi/ucl_logo.png', 'drawable-nodpi/ic_launcher_foreground.png', 'mipmap-xxxhdpi/ic_launcher.png', 'mipmap-anydpi-v26/ic_launcher.xml', 'font/web_inter.ttf']) {
  if (!fs.existsSync(path.join(root, 'res', asset))) failures.push(`Missing ${asset}`)
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
else console.log(`Checked ${keys.size} website copy keys in both languages, ${iconNames.size} referenced icons, and customer image/font assets. This is an asset contract check, not a pixel comparison.`)
