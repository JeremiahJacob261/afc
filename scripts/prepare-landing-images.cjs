/* Transcodes supplied originals without upscaling or inventing missing detail. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const source = path.join(__dirname, '..', 'public', 'landing-reference');
  const output = path.join(source, 'responsive');
  fs.mkdirSync(output, { recursive: true });
  const manifest = {};
  for (const file of fs.readdirSync(source).filter(name => name.endsWith('.png') && name !== 'football-sections.png')) {
    const name = path.basename(file, '.png');
    const input = path.join(source, file);
    const metadata = await sharp(input).metadata();
    const ratio = name === 'hero' || name === 'match-phone' ? metadata.width / metadata.height
      : name.startsWith('badge-') ? 1
      : name.startsWith('carousel-') || name.startsWith('resource-') ? 4 / 3
      : ['football', 'floodlight', 'wallet', 'market-ball', 'blue-stadium'].includes(name) ? 16 / 9 : 3 / 2;
    const background = name === 'blue-stadium' || name.startsWith('carousel-') ? '#080f32'
      : name === 'blue-check' || name === 'blue-wallet' ? '#eaf1ff' : '#fdfcf8';
    const widths = [...new Set([48, 96, 192, 320, 480, 768, 1024, 1280, 1536, metadata.width].filter(width => width <= metadata.width))].sort((a, b) => a - b);
    for (const width of widths) {
      for (const format of ['webp', 'avif']) {
        await sharp(input).resize({ width, height: Math.round(width / ratio), fit: 'contain', background, withoutEnlargement: true })[format]({ quality: format === 'avif' ? 65 : 82 }).toFile(path.join(output, `${name}-${width}.${format}`));
      }
    }
    manifest[name] = { width: metadata.width, height: Math.round(metadata.width / ratio), sourceWidth: metadata.width, sourceHeight: metadata.height, widths };
  }
  fs.writeFileSync(path.join(__dirname, '..', 'components', 'ucl', 'landing-images.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Prepared ${Object.keys(manifest).length} original assets as AVIF/WebP; no upscaling.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
