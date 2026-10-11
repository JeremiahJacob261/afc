const PREFIX = 'ucl:auth-login'

function getMarkName(label) {
  return `${PREFIX}:${label}`
}

export function clearAuthLoginTiming() {
  if (typeof window === 'undefined' || !window.performance) return

  window.performance.getEntriesByType('mark')
    .filter((entry) => entry.name.startsWith(`${PREFIX}:`))
    .forEach((entry) => window.performance.clearMarks(entry.name))
  window.performance.getEntriesByType('measure')
    .filter((entry) => entry.name.startsWith(`${PREFIX}:`))
    .forEach((entry) => window.performance.clearMeasures(entry.name))
}

export function markAuthLogin(label) {
  if (typeof window === 'undefined' || !window.performance?.mark) return
  const name = getMarkName(label)
  if (window.performance.getEntriesByName(name, 'mark').length) return
  window.performance.mark(name)
}

export function measureAuthLogin(stage, startLabel, endLabel) {
  if (typeof window === 'undefined' || !window.performance?.measure) return null

  const startMark = getMarkName(startLabel)
  const endMark = getMarkName(endLabel)
  const hasStart = window.performance.getEntriesByName(startMark, 'mark').length > 0
  const hasEnd = window.performance.getEntriesByName(endMark, 'mark').length > 0
  if (!hasStart || !hasEnd) return null

  const measureName = getMarkName(stage)
  const existingMeasure = window.performance.getEntriesByName(measureName, 'measure')[0]
  if (existingMeasure) return existingMeasure.duration

  const durationMs = window.performance.measure(measureName, startMark, endMark).duration
  console.info('[auth-timing]', { stage, durationMs: Math.round(durationMs) })
  return durationMs
}
