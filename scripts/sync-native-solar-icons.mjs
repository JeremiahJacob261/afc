import fs from 'node:fs/promises'
import path from 'node:path'
const names = ['gift-bold', 'football-bold', 'bell-bing-bold', 'shield-check-bold', 'wallet-money-bold',
  'card-transfer-bold', 'bell-bold', 'bell-off-bold', 'bill-list-bold', 'history-bold']
const directory = path.resolve('android/native/app/src/main/res/drawable')
for (const name of names) {
  const response = await fetch(`https://api.iconify.design/solar/${name}.svg`)
  if (!response.ok) throw new Error(`${name}: ${response.status}`)
  const svg = await response.text()
  if (/<(?:rect|line|ellipse|polygon|polyline)\b|\btransform=/.test(svg)) throw new Error(`Unsupported geometry in ${name}`)
  const attributes = raw => Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]))
  const geometry = [...svg.matchAll(/<(path|circle)\b([^>]+)\/?\s*>/g)].map(([, type, raw]) => {
    const a = attributes(raw)
    let d = a.d
    if (type === 'circle') { const x = +a.cx, y = +a.cy, r = +a.r; d = `M ${x-r},${y} a ${r},${r} 0 1,0 ${2*r},0 a ${r},${r} 0 1,0 ${-2*r},0` }
    return `<path android:pathData="${d}" android:fillColor="${a.fill === 'none' ? '@android:color/transparent' : '#FF080F32'}" android:fillType="${a['fill-rule'] === 'evenodd' ? 'evenOdd' : 'nonZero'}"${a.opacity ? ` android:fillAlpha="${a.opacity}"` : ''}${a.stroke ? ` android:strokeColor="#FF080F32" android:strokeWidth="${a['stroke-width'] || 1.5}" android:strokeLineCap="round" android:strokeLineJoin="round"` : ''} />`
  })
  await fs.writeFile(path.join(directory, `web_solar_${name.replaceAll('-', '_')}.xml`), `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n${geometry.join('\n')}\n</vector>\n`)
}
const collections = await fetch('https://raw.githubusercontent.com/iconify/icon-sets/master/collections.json').then(r => r.json())
await fs.writeFile(path.resolve('android/native/parity/Solar-icons-license.json'), JSON.stringify(collections.solar, null, 2) + '\n')
console.log(`Synced ${names.length} website Solar icons with attribution metadata.`)
