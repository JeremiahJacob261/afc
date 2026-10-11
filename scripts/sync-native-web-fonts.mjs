import fs from 'node:fs/promises'
import path from 'node:path'
const fontDirectory = path.resolve('android/native/app/src/main/res/font')
await fs.mkdir(fontDirectory, { recursive: true })
const response = await fetch('https://fonts.googleapis.com/css?family=Inter:400')
if (!response.ok) throw new Error(`Google Fonts: ${response.status}`)
const css = await response.text()
const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/)?.[1]
if (!fontUrl) throw new Error('No Inter TrueType font in official CSS')
const font = await fetch(fontUrl)
if (!font.ok) throw new Error(`Inter download: ${font.status}`)
await fs.writeFile(path.join(fontDirectory, 'web_inter.ttf'), Buffer.from(await font.arrayBuffer()))
const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt')
if (!license.ok) throw new Error(`Inter license: ${license.status}`)
await fs.writeFile(path.resolve('android/native/parity/Inter-OFL.txt'), await license.text())
console.log('Bundled the website Inter typeface and its OFL license.')
