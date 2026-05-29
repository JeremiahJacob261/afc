import { useEffect, useMemo, useState } from 'react'

function toValidDate(value) {
  const date = new Date(value || '')
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeEpochMs(value) {
  if (value === null || value === undefined || value === '') return null

  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null

  return timestamp < 1000000000000 ? timestamp * 1000 : timestamp
}

function getFallbackDate(match) {
  const dateText = String(match?.match_date || match?.date || '').trim()
  const timeText = String(match?.match_time || match?.time || '').trim()

  if (!dateText && !timeText) return null

  if (dateText && (dateText.includes(':') || dateText.includes('T'))) {
    return toValidDate(dateText)
  }

  return toValidDate([dateText, timeText].filter(Boolean).join(' '))
}

export function getMatchStartMs(match) {
  const tsgmt = normalizeEpochMs(match?.tsgmt)
  if (tsgmt) return tsgmt

  const timestDate = toValidDate(match?.timest)
  if (timestDate) return timestDate.getTime()

  const fallbackDate = getFallbackDate(match)
  return fallbackDate ? fallbackDate.getTime() : null
}

function getFormatterOptions(options = {}) {
  const { locale = 'en-GB', timeZone } = options
  return { locale, timeZone }
}

export function formatMatchDate(match, options = {}) {
  const startMs = getMatchStartMs(match)
  if (!startMs) return 'TBD'

  const { locale, timeZone } = getFormatterOptions(options)
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(startMs))
}

export function formatMatchTime(match, options = {}) {
  const startMs = getMatchStartMs(match)
  if (!startMs) return 'TBD'

  const { locale, timeZone } = getFormatterOptions(options)
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(startMs))
}

export function formatMatchDateTime(match, options = {}) {
  const startMs = getMatchStartMs(match)
  if (!startMs) return 'TBD'

  const { locale, timeZone } = getFormatterOptions(options)
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(startMs))
}

export function isMatchInFuture(match, nowMs = Date.now()) {
  const startMs = getMatchStartMs(match)
  return Boolean(startMs && startMs > nowMs)
}

export function useClientMatchDisplay(match, options = {}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { locale, timeZone } = options

  return useMemo(() => {
    const startMs = getMatchStartMs(match)

    if (!mounted) {
      return {
        startMs,
        date: 'TBD',
        time: 'TBD',
        dateTime: 'TBD',
      }
    }

    return {
      startMs,
      date: formatMatchDate(match, { locale, timeZone }),
      time: formatMatchTime(match, { locale, timeZone }),
      dateTime: formatMatchDateTime(match, { locale, timeZone }),
    }
  }, [match, mounted, locale, timeZone])
}
