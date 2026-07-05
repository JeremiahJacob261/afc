export function getLocalStorageItem(key, fallback = null) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ?? fallback
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}"`, error)
    return fallback
  }
}

export function setLocalStorageItem(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return false

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn(`Unable to write localStorage key "${key}"`, error)
    return false
  }
}

export function removeLocalStorageItem(key) {
  if (typeof window === 'undefined' || !window.localStorage) return false

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn(`Unable to remove localStorage key "${key}"`, error)
    return false
  }
}
