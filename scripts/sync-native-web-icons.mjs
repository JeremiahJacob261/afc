import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as icons from 'lucide-react'

// Render the same Lucide geometry used by pages/user, as Android VectorDrawables.
const names = ['Home', 'Trophy', 'History', 'Wallet', 'Menu', 'Bell', 'BellOff', 'ArrowLeft', 'ArrowRight',
  'ArrowUpRight', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'Clock3', 'Send', 'MessageCircle',
  'ArrowDownToLine', 'ArrowUpFromLine', 'CircleHelp', 'Copy', 'Check', 'Link2', 'LockKeyhole', 'LogOut',
  'ShieldCheck', 'Sparkles', 'UsersRound', 'Gift', 'CreditCard', 'Diamond', 'TrendingUp', 'Upload', 'RefreshCw', 'Ticket', 'CalendarDays', 'FileImage', 'X']
const target = path.resolve('android/native/app/src/main/res/drawable')
const attrs = value => Object.fromEntries([...value.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, val]) => [key, val]))
for (const name of names) {
  const svg = renderToStaticMarkup(React.createElement(icons[name], { size: 24, strokeWidth: 1.8 }))
  const paths = [...svg.matchAll(/<(path|circle|rect|line|polyline|polygon)\b([^>]*?)\/?\s*>/g)].map(([, type, raw]) => {
    const a = attrs(raw)
    let d = a.d
    if (type === 'circle') {
      const x = Number(a.cx), y = Number(a.cy), r = Number(a.r)
      d = `M ${x-r},${y} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 ${-r*2},0`
    } else if (type === 'line') d = `M ${a.x1},${a.y1} L ${a.x2},${a.y2}`
    else if (type === 'polyline' || type === 'polygon') d = `M ${a.points.trim().replace(/\s+/g, ' L ')}${type === 'polygon' ? ' Z' : ''}`
    else if (type === 'rect') {
      const x = Number(a.x), y = Number(a.y), w = Number(a.width), h = Number(a.height), r = Number(a.rx || 0)
      d = `M ${x+r},${y} H ${x+w-r} Q ${x+w},${y} ${x+w},${y+r} V ${y+h-r} Q ${x+w},${y+h} ${x+w-r},${y+h} H ${x+r} Q ${x},${y+h} ${x},${y+h-r} V ${y+r} Q ${x},${y} ${x+r},${y} Z`
    }
    if (!d) throw new Error(`Unsupported icon geometry: ${name} ${type}`)
    return `    <path android:pathData="${d}" android:fillColor="@android:color/transparent" android:strokeColor="#FF080F32" android:strokeWidth="1.8" android:strokeLineCap="round" android:strokeLineJoin="round" />`
  })
  const filename = `web_${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}.xml`
  fs.writeFileSync(path.join(target, filename), `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n${paths.join('\n')}\n</vector>\n`)
}
console.log(`Synced ${names.length} website icons to native resources.`)
