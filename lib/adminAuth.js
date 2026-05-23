import crypto from 'crypto'
import { parse, serialize } from 'cookie'

export const ADMIN_COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8

export function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET
    || process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
}

export function getAdminSessionToken() {
  const secret = getAdminSecret()
  if (!secret) return ''

  return crypto
    .createHash('sha256')
    .update(`afc-admin-session:${secret}`)
    .digest('hex')
}

export function isValidAdminPassword(password) {
  const expected = process.env.ADMIN_ACTION_PASSWORD
    || (process.env.NODE_ENV === 'production' ? '' : 'passwordadmin')
  if (!expected) return false

  const provided = Buffer.from(String(password || ''))
  const target = Buffer.from(String(expected))
  if (provided.length !== target.length) return false

  return crypto.timingSafeEqual(provided, target)
}

export function isValidAdminToken(token) {
  const expected = getAdminSessionToken()
  if (!expected || !token) return false

  const provided = Buffer.from(String(token))
  const target = Buffer.from(expected)
  if (provided.length !== target.length) return false

  return crypto.timingSafeEqual(provided, target)
}

export function getAdminTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || '')
  return cookies[ADMIN_COOKIE_NAME] || req.headers['x-admin-session'] || ''
}

export function requireAdmin(req) {
  const token = getAdminTokenFromRequest(req)
  const headerPassword = req.headers['x-admin-password']

  if (isValidAdminToken(token) || isValidAdminPassword(headerPassword)) {
    return true
  }

  const error = new Error('Unauthorized')
  error.statusCode = 401
  throw error
}

export function setAdminSessionCookie(res) {
  const token = getAdminSessionToken()
  if (!token) {
    const error = new Error('Missing ADMIN_ACTION_PASSWORD or ADMIN_SESSION_SECRET')
    error.statusCode = 500
    throw error
  }

  res.setHeader('Set-Cookie', serialize(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }))
}

export function clearAdminSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }))
}
