import { getMatchStartMs } from './matchDisplay'

export function upcomingFixtures(fixtures, now) {
  return (Array.isArray(fixtures) ? fixtures : []).filter((match) => match.verified === false && getMatchStartMs(match) > now)
    .sort((a, b) => getMatchStartMs(a) - getMatchStartMs(b))
}
export function groupFixturesByDay(fixtures, locale) {
  const groups = new Map()
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  fixtures.forEach((match) => {
    const day = formatter.format(new Date(getMatchStartMs(match)))
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push(match)
  })
  return [...groups]
}
