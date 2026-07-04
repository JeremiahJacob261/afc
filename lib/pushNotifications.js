import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import enCommon from '../locales/en/common.json'
import esCommon from '../locales/es/common.json'
import frCommon from '../locales/fr/common.json'
import myCommon from '../locales/my/common.json'
import ruCommon from '../locales/ru/common.json'
import arCommon from '../locales/ar/common.json'

const invalidTokenCodes = new Set([
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
])

const pushLocales = {
  en: enCommon,
  es: esCommon,
  fr: frCommon,
  my: myCommon,
  ru: ruCommon,
  ar: arCommon,
}

const supportedPushLanguages = new Set(Object.keys(pushLocales))

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
}

function hasFirebaseConfig() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey())
}

function firebaseApp() {
  if (!hasFirebaseConfig()) return null
  if (getApps().length) return getApps()[0]

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey(),
    }),
  })
}

function asText(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function toPushData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, asText(value)])
  )
}

function pushLanguage(language) {
  const normalized = String(language || 'en').trim().toLowerCase()
  return supportedPushLanguages.has(normalized) ? normalized : 'en'
}

function localeValue(locale, key) {
  return String(key || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), locale)
}

function displayPushValue(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(2)
  return String(value)
}

function translatePushKey(key, language) {
  const normalized = pushLanguage(language)
  const template = localeValue(pushLocales[normalized], key) || localeValue(pushLocales.en, key)
  return typeof template === 'string' ? template : String(key || '')
}

function resolvePushValues(values = {}, language) {
  return Object.entries(values || {}).reduce((acc, [key, value]) => {
    if (key === 'typeKey' && typeof value === 'string') {
      acc.typeLabel = translatePushKey(value, language).toLowerCase()
      return acc
    }

    if (key === 'statusKey' && typeof value === 'string') {
      acc.status = translatePushKey(value, language).toLowerCase()
      return acc
    }

    if (key === 'outcomeKey' && typeof value === 'string') {
      acc.outcome = translatePushKey(value, language).toLowerCase()
      return acc
    }

    if (key.endsWith('Key') && typeof value === 'string') {
      acc[key.slice(0, -3)] = translatePushKey(value, language)
      return acc
    }

    acc[key] = value
    return acc
  }, {})
}

function interpolate(template, values = {}) {
  return String(template).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => displayPushValue(values[key.trim()]))
}

function translatePushText(key, values, language, fallback) {
  const normalized = pushLanguage(language)
  if (normalized === 'en' && fallback) return fallback

  const template = localeValue(pushLocales[normalized], key) || localeValue(pushLocales.en, key)
  if (!template || typeof template !== 'string') return fallback
  return interpolate(template, resolvePushValues(values, normalized))
}

function localizedPushMessage(message, language) {
  const eventType = message.data?.eventType
  if (!eventType) return message

  const keyPrefix = `mobile.notifications.events.${eventType}`
  return {
    ...message,
    title: translatePushText(`${keyPrefix}.title`, message.data, language, message.title),
    body: translatePushText(`${keyPrefix}.message`, message.data, language, message.body),
  }
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function normalizeTokenInput(item) {
  if (!item) return null
  if (typeof item === 'string') return { token: item, language: 'en' }
  if (!item.token) return null
  return { token: item.token, language: pushLanguage(item.language) }
}

function groupTokensByMessage(tokens, message) {
  const groups = new Map()

  tokens.forEach((item) => {
    const tokenInput = normalizeTokenInput(item)
    if (!tokenInput) return

    const localized = localizedPushMessage(message, tokenInput.language)
    const key = JSON.stringify({
      title: localized.title,
      body: localized.body,
      data: localized.data || {},
    })
    const group = groups.get(key) || { message: localized, tokens: [] }
    group.tokens.push(tokenInput.token)
    groups.set(key, group)
  })

  return [...groups.values()].map((group) => ({
    ...group,
    tokens: [...new Set(group.tokens)],
  }))
}

function sourceFilter(query, sourceTable, sourceId) {
  return query
    .eq('source_table', sourceTable)
    .eq('source_id', String(sourceId))
}

async function findExistingNotification(supabase, recipientUsername, eventType, sourceTable, sourceId) {
  if (!sourceTable || sourceId === undefined || sourceId === null || sourceId === '') return null

  const { data, error } = await sourceFilter(
    supabase
      .from('app_notifications')
      .select('*')
      .eq('recipient_username', recipientUsername)
      .eq('event_type', eventType),
    sourceTable,
    sourceId
  ).maybeSingle()

  if (error) throw error
  return data || null
}

export async function createAppNotification(supabase, input) {
  const recipientUsername = String(input.recipientUsername || '').trim()
  const eventType = String(input.eventType || '').trim()
  const title = String(input.title || '').trim()
  const body = String(input.body || '').trim()

  if (!recipientUsername || !eventType || !title || !body) {
    throw new Error('Invalid app notification payload')
  }

  const sourceTable = input.sourceTable ? String(input.sourceTable) : null
  const sourceId = input.sourceId === undefined || input.sourceId === null ? null : String(input.sourceId)
  const existing = await findExistingNotification(supabase, recipientUsername, eventType, sourceTable, sourceId)
  if (existing) return { notification: existing, created: false }

  const { data, error } = await supabase
    .from('app_notifications')
    .insert({
      recipient_username: recipientUsername,
      event_type: eventType,
      title,
      body,
      data: input.data || {},
      source_table: sourceTable,
      source_id: sourceId,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      const duplicated = await findExistingNotification(supabase, recipientUsername, eventType, sourceTable, sourceId)
      if (duplicated) return { notification: duplicated, created: false }
    }
    throw error
  }

  return { notification: data, created: true }
}

async function disableTokens(supabase, tokens) {
  const uniqueTokens = [...new Set(tokens.filter(Boolean))]
  if (!uniqueTokens.length) return

  const { error } = await supabase
    .from('push_tokens')
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .in('token', uniqueTokens)

  if (error) console.warn('Unable to disable invalid push tokens:', error)
}

export async function sendPushToTokens(supabase, tokens, message) {
  const app = firebaseApp()
  const messageGroups = groupTokensByMessage(tokens, message)
  const tokenCount = messageGroups.reduce((count, group) => count + group.tokens.length, 0)
  if (!app || !tokenCount) {
    return { sent: 0, failed: 0, skipped: tokenCount, firebaseConfigured: Boolean(app) }
  }

  let sent = 0
  let failed = 0
  const invalidTokens = []
  const messaging = getMessaging(app)

  for (const group of messageGroups) {
    for (const tokenBatch of chunk(group.tokens, 500)) {
      const response = await messaging.sendEachForMulticast({
        tokens: tokenBatch,
        notification: {
          title: group.message.title,
          body: group.message.body,
        },
        data: toPushData(group.message.data),
        android: {
          priority: 'high',
          notification: {
            channelId: 'efc_updates',
            sound: 'default',
          },
        },
      })

      sent += response.successCount
      failed += response.failureCount
      response.responses.forEach((result, index) => {
        const code = result.error?.errorInfo?.code || result.error?.code
        if (!result.success && invalidTokenCodes.has(code)) {
          invalidTokens.push(tokenBatch[index])
        }
      })
    }
  }

  await disableTokens(supabase, invalidTokens)
  return { sent, failed, skipped: 0, firebaseConfigured: true }
}

export async function sendPushToUsername(supabase, username, message) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token,language')
    .eq('username', username)
    .eq('enabled', true)

  if (error) throw error
  return sendPushToTokens(supabase, data || [], message)
}

export async function notifyUser(supabase, input) {
  const result = await createAppNotification(supabase, input)
  if (!result.created) return { ...result, push: { sent: 0, failed: 0, skipped: 0, duplicate: true } }

  const push = await sendPushToUsername(supabase, input.recipientUsername, {
    title: input.title,
    body: input.body,
    data: {
      ...(input.data || {}),
      eventType: input.eventType,
      notificationId: result.notification.id,
      route: input.data?.route || 'notifications',
    },
  })

  return { ...result, push }
}

export async function notifyUsers(supabase, recipients, inputForRecipient) {
  const results = []
  for (const recipient of recipients) {
    const input = typeof inputForRecipient === 'function' ? inputForRecipient(recipient) : inputForRecipient
    results.push(await notifyUser(supabase, {
      ...input,
      recipientUsername: recipient.username || recipient.recipientUsername || recipient,
    }))
  }
  return results
}

export async function broadcastToActivePushUsers(supabase, input) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('username')
    .eq('enabled', true)

  if (error) throw error

  const usernames = [...new Set((data || []).map((row) => row.username).filter(Boolean))]
  return notifyUsers(supabase, usernames, (username) => ({
    ...input,
    recipientUsername: username,
  }))
}

export async function notifyFinanceAction(supabase, { transaction, action, sent, amount }) {
  const type = String(transaction?.type || '').toLowerCase()
  const isDeposit = type === 'deposit'
  const isWithdrawal = type === 'withdraw' || type === 'withdrawer'
  if (!transaction?.username || (!isDeposit && !isWithdrawal)) return null

  const approved = action === 'approve' && sent === 'success'
  const declined = action === 'reject' || sent === 'failed'
  if (!approved && !declined) return null

  const eventType = `${isDeposit ? 'deposit' : 'withdrawal'}_${approved ? 'approved' : 'declined'}`
  const label = isDeposit ? 'Deposit' : 'Withdrawal'
  const status = approved ? 'approved' : 'declined'
  const displayAmount = Number(amount || transaction.amount || 0)
  const method = String(transaction.method || 'USDT').toUpperCase()

  return notifyUser(supabase, {
    recipientUsername: transaction.username,
    eventType,
    title: `${label} ${status}`,
    body: `Your ${label.toLowerCase()} of ${displayAmount.toFixed(2)} ${method} was ${status}.`,
    sourceTable: 'notification',
    sourceId: transaction.id || transaction.uid,
    data: {
      route: 'notifications',
      transactionId: transaction.id || transaction.uid,
      category: isDeposit ? 'deposit' : 'withdrawal',
      status,
      amount: displayAmount,
      method,
    },
  })
}

export async function notifyCompanyMatchPosted(supabase, match) {
  if (!match?.company) return null

  const home = match.home || 'Home'
  const away = match.away || 'Away'
  return broadcastToActivePushUsers(supabase, {
    eventType: 'company_match_posted',
    title: 'New company match',
    body: `${home} vs ${away} is now available.`,
    sourceTable: 'bets',
    sourceId: match.match_id || match.id,
    data: {
      route: 'match',
      matchId: match.match_id || match.id,
      home,
      away,
      league: match.league || '',
    },
  })
}

function normalizedBetOutcome(bet, result) {
  const won = String(bet.won || '').toLowerCase()
  const protectedMarket = result?.protectedMarket
  if (result?.company && protectedMarket && bet.market === protectedMarket && won === 'true') return 'refunded'
  if (won === 'true') return 'won'
  if (won === 'false') return 'lost'
  return 'settled'
}

export async function notifyBetSettlements(supabase, result) {
  if (!result?.matchId || result.alreadySettled) return []

  const { data: rows, error } = await supabase
    .from('placed')
    .select('betid,match_id,market,username,stake,aim,profit,won,home,away')
    .eq('match_id', result.matchId)
    .in('won', ['true', 'false'])

  if (error) throw error

  return notifyUsers(supabase, rows || [], (bet) => {
    const outcome = normalizedBetOutcome(bet, result)
    const home = bet.home || 'Home'
    const away = bet.away || 'Away'
    const stake = Number(bet.stake || 0)
    const payout = outcome === 'won'
      ? Number(bet.stake || 0) + Number(bet.aim || 0)
      : outcome === 'refunded'
        ? stake
        : 0

    return {
      recipientUsername: bet.username,
      eventType: 'bet_settled',
      title: outcome === 'won' ? 'Bet won' : outcome === 'refunded' ? 'Bet refunded' : 'Bet settled',
      body: outcome === 'won'
        ? `Your ${home} vs ${away} bet won ${payout.toFixed(2)} USDT.`
        : outcome === 'refunded'
          ? `Your ${home} vs ${away} stake was refunded.`
          : `Your ${home} vs ${away} bet has been settled.`,
      sourceTable: 'placed',
      sourceId: bet.betid,
      data: {
        route: 'bet',
        outcome,
        outcomeKey: `status.${outcome}`,
        betId: bet.betid,
        matchId: bet.match_id,
        home,
        away,
        stake,
        payout,
      },
    }
  })
}

export async function notifyTeamMemberJoined(supabase, newUser) {
  const levels = [
    { code: newUser.refer, level: 1 },
    { code: newUser.lvla, level: 2 },
    { code: newUser.lvlb, level: 3 },
  ].filter((item) => item.code && item.code !== 'null')

  if (!levels.length) return []

  const codes = [...new Set(levels.map((item) => item.code))]
  const { data: uplines, error } = await supabase
    .from('users')
    .select('username,newrefer')
    .in('newrefer', codes)

  if (error) throw error

  const levelByCode = new Map(levels.map((item) => [item.code, item.level]))
  return notifyUsers(supabase, uplines || [], (upline) => {
    const level = levelByCode.get(upline.newrefer) || 1
    return {
      recipientUsername: upline.username,
      eventType: 'team_member_joined',
      title: 'New team member',
      body: `${newUser.username} joined your level ${level} team.`,
      sourceTable: 'users',
      sourceId: newUser.userid || newUser.username,
      data: {
        route: 'referrals',
        username: newUser.username,
        level,
      },
    }
  })
}
