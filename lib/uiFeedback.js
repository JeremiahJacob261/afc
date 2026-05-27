export function waitForPaint() {
  if (typeof window === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve)
    })
  })
}
