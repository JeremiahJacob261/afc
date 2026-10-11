import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const source = 'public/champions-league-logo.png'
const res = 'android/native/app/src/main/res'
await sharp(source).resize(384, 384).png().toFile(path.join(res, 'drawable-nodpi/ucl_logo.png'))
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  const directory = path.join(res, `mipmap-${density}`)
  await fs.mkdir(directory, { recursive: true })
  await sharp(source).resize(size, size, { fit: 'contain' }).png().toFile(path.join(directory, 'ic_launcher.png'))
}
// 64dp artwork inside the 108dp adaptive layer stays inside Android's safe zone.
await sharp(source).resize(256, 256).extend({ top: 88, bottom: 88, left: 88, right: 88, background: '#00000000' })
  .png().toFile(path.join(res, 'drawable-nodpi/ic_launcher_foreground.png'))
console.log('Bundled the website UCL logo and generated Android launcher assets.')
