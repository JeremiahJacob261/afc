function getValidDate(value) {
  const date = new Date(value || '')
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatMatchDate(match) {
  const date = getValidDate(match?.date || match?.timest)
  if (!date) return 'TBD'
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatMatchTime(match) {
  const rawTime = String(match?.time || '')
  const [hour, minute] = rawTime.split(':')
  const numericHour = Number(hour)

  if (!Number.isFinite(numericHour) || !minute) return 'TBD'

  return `${numericHour - 1}:${minute.padStart(2, '0')}`
}
