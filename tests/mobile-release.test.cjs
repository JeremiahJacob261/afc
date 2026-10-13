const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const filename = path.resolve(__dirname, '../pages/api/mobile/release.js')
const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const release = {
  applicationId: 'com.pro.uclfootball', versionCode: 7, versionName: '1.0.6',
  downloadUrl: 'https://ucl01.com/downloads/ucl-1.0.6-7.apk',
  releaseOrigin: 'https://ucl01.com', sha256: 'a'.repeat(64),
}

function request(env = {}, bundled = release, method = 'GET') {
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', 'process', output)(
    () => bundled, loaded, loaded.exports, { env })
  const response = {
    code: 200, headers: {},
    status(code) { this.code = code; return this },
    setHeader(key, value) { this.headers[key] = value },
    json(body) { this.body = body; return this },
  }
  loaded.exports.default({ method }, response)
  return response
}

test('advertises the bundled signed release without deployment environment settings', () => {
  const response = request()
  assert.equal(response.code, 200)
  assert.equal(response.headers['Cache-Control'], 'no-store')
  assert.deepEqual(response.body, {
    applicationId: release.applicationId, versionCode: 7, versionName: '1.0.6',
    downloadUrl: release.downloadUrl, sha256: release.sha256,
  })
})

test('complete deployment settings override the bundled release', () => {
  const response = request({
    UCL_ANDROID_VERSION_CODE: '8', UCL_ANDROID_VERSION_NAME: '1.0.7',
    UCL_ANDROID_APK_URL: 'https://ucl01.com/downloads/ucl-1.0.7-8.apk',
    UCL_ANDROID_RELEASE_ORIGIN: 'https://ucl01.com', UCL_ANDROID_APK_SHA256: 'B'.repeat(64),
  })
  assert.equal(response.body.versionCode, 8)
  assert.equal(response.body.sha256, 'b'.repeat(64))
})

test('partial deployment settings never mix versions and checksums with the bundle', () => {
  assert.equal(request({ UCL_ANDROID_VERSION_CODE: '8' }).body.versionCode, 0)
})

test('invalid release URLs, versions and checksums are not advertised', () => {
  for (const patch of [
    { downloadUrl: 'https://other.example/ucl.apk' },
    { downloadUrl: 'http://ucl01.com/ucl.apk' },
    { downloadUrl: 'https://ucl01.com/ucl.apk?token=123' },
    { downloadUrl: 'https://ucl01.com/ucl.apk#download' },
    { downloadUrl: 'https://user:password@ucl01.com/ucl.apk' },
    { downloadUrl: 'https://ucl01.com/ucl.zip' },
    { versionCode: 0 }, { versionCode: 1.5 }, { sha256: '' }, { versionName: '' },
  ]) assert.equal(request({}, { ...release, ...patch }).body.versionCode, 0)
})

test('release endpoint rejects writes', () => {
  assert.equal(request({}, release, 'POST').code, 405)
})
