export function pageSize(value, fallback = 30, max = 50) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback
}

export function decodeCursor(value) {
  if (!value) return {}
  try {
    if (String(value).length > 4096) throw new Error('Cursor too long')
    const decoded = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'))
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error('Invalid cursor')
    for (const id of Object.values(decoded)) {
      if (id !== null && !/^\d+$/.test(String(id))) throw new Error('Invalid cursor')
    }
    return decoded
  } catch {
    const error = new Error('Invalid page cursor')
    error.statusCode = 400
    throw error
  }
}

export function encodeCursor(values) { return Buffer.from(JSON.stringify(values)).toString('base64url') }

export function applyCursor(query, cursor, key, limit) {
  if (cursor[key] === null) return Promise.resolve({ data: [], error: null, count: 0 })
  if (cursor[key] !== undefined) query = query.lt('id', cursor[key])
  return query.order('id', { ascending: false }).limit(limit + 1)
}

export function cursorPage(rows = [], limit) {
  const data = rows.slice(0, limit)
  return { data, next: rows.length > limit ? String(data[data.length - 1].id) : null }
}
