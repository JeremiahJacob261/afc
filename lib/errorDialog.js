const listeners = new Set()
let pendingErrors = []

export function showErrorDialog(message) {
  const text = (message instanceof Error ? message.message : String(message ?? '')).trim()
  if (typeof window === 'undefined') {
    throw new Error('Error dialogs can only be opened in a browser')
  }

  if (listeners.size === 0) {
    pendingErrors.push(text)
    return
  }

  listeners.forEach((listener) => listener(text))
}

export function subscribeToErrorDialogs(listener) {
  listeners.add(listener)
  pendingErrors.forEach(listener)
  pendingErrors = []

  return () => listeners.delete(listener)
}
