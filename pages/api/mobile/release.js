import bundledRelease from '@/data/android-release.json'

// Deployment-owned manifest. Environment settings can override the bundled signed release.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  const environmentRelease = ['UCL_ANDROID_VERSION_CODE', 'UCL_ANDROID_VERSION_NAME',
    'UCL_ANDROID_APK_URL', 'UCL_ANDROID_RELEASE_ORIGIN', 'UCL_ANDROID_APK_SHA256']
    .some(key => process.env[key] !== undefined)
  const release = environmentRelease ? {
    versionCode: process.env.UCL_ANDROID_VERSION_CODE,
    versionName: process.env.UCL_ANDROID_VERSION_NAME,
    downloadUrl: process.env.UCL_ANDROID_APK_URL,
    releaseOrigin: process.env.UCL_ANDROID_RELEASE_ORIGIN,
    sha256: process.env.UCL_ANDROID_APK_SHA256,
  } : bundledRelease
  const versionCode = Number(release.versionCode || 0)
  const versionName = String(release.versionName || '').trim()
  const downloadUrl = String(release.downloadUrl || '').trim()
  const releaseOrigin = String(release.releaseOrigin || '').trim()
  const sha256 = String(release.sha256 || '').trim()
  try {
    const origin = new URL(releaseOrigin)
    const download = new URL(downloadUrl)
    if (!Number.isSafeInteger(versionCode) || versionCode < 1 || !versionName ||
        origin.protocol !== 'https:' || download.protocol !== 'https:' ||
        download.origin !== origin.origin || download.username || download.password ||
        download.search || download.hash || !download.pathname.endsWith('.apk') ||
        !/^[a-f0-9]{64}$/i.test(sha256)) throw new Error('Release not configured')
    return res.status(200).json({ applicationId: 'com.pro.uclfootball', versionCode,
      versionName, downloadUrl, sha256: sha256.toLowerCase() })
  } catch {
    return res.status(200).json({ applicationId: 'com.pro.uclfootball', versionCode: 0 })
  }
}
