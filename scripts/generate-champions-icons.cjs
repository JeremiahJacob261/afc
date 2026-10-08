const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const logo = path.join(root, 'public', 'champions-league-logo.png');
const icons = path.join(root, 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function resized(size) {
  return sharp(logo).resize(size, size).png().toBuffer();
}

async function writeIco(file) {
  const icoSizes = [16, 32, 48, 64, 256];
  const images = await Promise.all(icoSizes.map(resized));
  const header = Buffer.alloc(6 + icoSizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoSizes.length, 4);
  let offset = header.length;
  for (let i = 0; i < icoSizes.length; i++) {
    const entry = 6 + i * 16;
    header.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], entry);
    header.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  }
  fs.writeFileSync(file, Buffer.concat([header, ...images]));
}

async function main() {
  fs.mkdirSync(icons, { recursive: true });
  await Promise.all(sizes.map(async size => {
    fs.writeFileSync(path.join(icons, `icon-${size}x${size}.png`), await resized(size));
  }));
  fs.writeFileSync(path.join(icons, 'apple-touch-icon.png'), await resized(180));
  const inset = await sharp(logo).resize(384, 384).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#06101F' },
  }).composite([{ input: inset, left: 64, top: 64 }])
    .png().toFile(path.join(icons, 'maskable-icon-512x512.png'));
  await writeIco(path.join(root, 'public', 'favicon.ico'));
  await writeIco(path.join(root, 'public', 'european.ico'));
  await writeIco(path.join(root, 'mobile', 'public', 'european.ico'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
