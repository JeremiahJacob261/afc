import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { apiFetch } from './api.js'

const pushTokenStorageKey = 'efc-push-token'
const deviceIdStorageKey = 'efc-device-id'
const languageStorageKey = 'efc-language'
const supportedLanguages = new Set(['en', 'fr', 'es', 'my', 'ru', 'ar'])

function isNativePushAvailable() {
  return Capacitor.isNativePlatform?.() && Capacitor.getPlatform?.() === 'android'
}

function getDeviceId() {
  let deviceId = window.localStorage.getItem(deviceIdStorageKey)
  if (!deviceId) {
    deviceId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    window.localStorage.setItem(deviceIdStorageKey, deviceId)
  }
  return deviceId
}

function storePushToken(token) {
  window.localStorage.setItem(pushTokenStorageKey, token)
}

export function getStoredPushToken() {
  return window.localStorage.getItem(pushTokenStorageKey) || ''
}

function currentLanguage() {
  const language = window.localStorage.getItem(languageStorageKey) || 'en'
  return supportedLanguages.has(language) ? language : 'en'
}

async function registerPushToken(token, language = currentLanguage()) {
  await apiFetch('/api/push/register-token', {
    auth: true,
    method: 'POST',
    body: {
      token,
      platform: 'android',
      deviceId: getDeviceId(),
      language,
    },
  })
}

export async function updateStoredPushTokenLanguage(language = currentLanguage()) {
  const token = getStoredPushToken()
  if (!token) return

  await registerPushToken(token, supportedLanguages.has(language) ? language : 'en')
}

export async function unregisterPushToken() {
  const token = getStoredPushToken()
  if (!token) return

  try {
    await apiFetch('/api/push/unregister-token', {
      auth: true,
      method: 'POST',
      body: { token },
    })
  } finally {
    window.localStorage.removeItem(pushTokenStorageKey)
  }
}

export async function setupPushNotifications({ onNotification, onAction, onError } = {}) {
  if (!isNativePushAvailable()) return () => {}

  const listeners = []

  try {
    await PushNotifications.createChannel?.({
      id: 'efc_updates',
      name: 'EFC Updates',
      description: 'Account, match, and bet updates',
      importance: 5,
      visibility: 1,
      sound: 'default',
    }).catch(() => null)

    let permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions()
    }

    if (permission.receive !== 'granted') {
      return () => {}
    }

    listeners.push(await PushNotifications.addListener('registration', async (token) => {
      const value = token?.value || ''
      if (!value) return

      await registerPushToken(value)
      storePushToken(value)
    }))

    listeners.push(await PushNotifications.addListener('registrationError', (error) => {
      onError?.(error)
    }))

    listeners.push(await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onNotification?.(notification)
    }))

    listeners.push(await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      onAction?.(action)
    }))

    await PushNotifications.register()
  } catch (error) {
    onError?.(error)
  }

  return () => {
    listeners.forEach((listener) => listener?.remove?.())
  }
}
