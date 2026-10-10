// Deployment-owned manifest. Only a signed APK on the API origin can be advertised.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')
  const versionCode = Number(process.env.UCL_ANDROID_VERSION_CODE || 0)
  const versionName = String(process.env.UCL_ANDROID_VERSION_NAME || '').trim()
  const downloadUrl = String(process.env.UCL_ANDROID_APK_URL || '').trim()
  const releaseOrigin = String(process.env.UCL_ANDROID_RELEASE_ORIGIN || '').trim()
  const sha256 = String(process.env.UCL_ANDROID_APK_SHA256 || '').trim()
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
