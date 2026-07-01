import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const distDir = resolve(repoRoot, 'mobile/dist')
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))

const version = process.env.MOBILE_UPDATE_VERSION || packageJson.version || '1.0.0'
const minNativeVersion = process.env.MOBILE_MIN_NATIVE_VERSION || process.env.VITE_NATIVE_VERSION || '1.0.0'
const baseUrl = (process.env.VITE_API_BASE_URL || 'https://europeanfc01.com').replace(/\/$/, '')
const updatesDir = resolve(repoRoot, 'public/mobile-updates/android')
const zipFile = resolve(updatesDir, `${version}.zip`)

if (!existsSync(resolve(distDir, 'index.html'))) {
  throw new Error('mobile/dist/index.html is missing. Run bun run mobile:build first.')
}

mkdirSync(updatesDir, { recursive: true })
rmSync(zipFile, { force: true })

execFileSync('zip', ['-qr', zipFile, '.'], {
  cwd: distDir,
  stdio: 'inherit',
})

const sha256 = createHash('sha256').update(readFileSync(zipFile)).digest('hex')
const manifest = {
  version,
  minNativeVersion,
  bundleUrl: `${baseUrl}/mobile-updates/android/${version}.zip`,
  sha256,
  mandatory: process.env.MOBILE_UPDATE_MANDATORY === 'true',
}

writeFileSync(
  resolve(updatesDir, 'latest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
)

console.log(`Packaged mobile update ${version}`)
console.log(`Bundle: public/mobile-updates/android/${version}.zip`)
console.log(`SHA-256: ${sha256}`)
