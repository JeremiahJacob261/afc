import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { mobileConfig } from './config.js'

const CURRENT_VERSION_KEY = 'efc-mobile-bundle-version'

function compareVersions(left, right) {
  const a = String(left || '0').split('.').map((part) => Number(part) || 0)
  const b = String(right || '0').split('.').map((part) => Number(part) || 0)
  const length = Math.max(a.length, b.length)

  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0)
    if (delta !== 0) return delta
  }

  return 0
}

export async function markBundleReady() {
  if (!Capacitor.isNativePlatform()) return

  try {
    await CapacitorUpdater.notifyAppReady()
  } catch (error) {
    console.warn('Unable to mark bundle ready', error)
  }
}

export async function checkForBundleUpdate() {
  if (!Capacitor.isNativePlatform() || !mobileConfig.updateManifestUrl) return null

  try {
    const response = await fetch(mobileConfig.updateManifestUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) return null

    const manifest = await response.json()
    if (!manifest?.version || !manifest?.bundleUrl) return null

    if (
      manifest.minNativeVersion &&
      compareVersions(mobileConfig.nativeVersion, manifest.minNativeVersion) < 0
    ) {
      return { skipped: true, reason: 'native-version-too-old' }
    }

    const currentVersion =
      window.localStorage.getItem(CURRENT_VERSION_KEY) || mobileConfig.nativeVersion

    if (compareVersions(manifest.version, currentVersion) <= 0) {
      return { skipped: true, reason: 'already-current' }
    }

    const bundle = await CapacitorUpdater.download({
      version: manifest.version,
      url: manifest.bundleUrl,
      ...(manifest.sha256 ? { checksum: manifest.sha256 } : {}),
    })

    await CapacitorUpdater.next({ id: bundle.id })
    window.localStorage.setItem(CURRENT_VERSION_KEY, manifest.version)

    return { updated: true, version: manifest.version }
  } catch (error) {
    console.warn('Mobile update check failed', error)
    return null
  }
}
