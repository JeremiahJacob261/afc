// Admin forms have action-specific recovery text. Do not replace it with a
// transport placeholder returned by a proxy or an unrecognized server failure.
export function adminErrorMessage(error, fallback) {
  const message = typeof error === 'string' ? error : error?.message
  const status = Number(error?.status || error?.statusCode || error?.httpStatus)
  if (status === 401 || /^(unauthorized|authentication required|invalid or expired session)$/i.test(message || '')) return 'Your admin session expired. Sign in again.'
  if (status === 403) return 'Your account does not have permission to do this.'
  if (status === 429) return 'Too many requests. Wait a few minutes before trying again.'
  if (!message || /^(server error|internal server error|unknown error|something went wrong[.!]?|request failed|network request failed[.!]?|failed to fetch|network error|load failed|an error occurred[.!]?)$/i.test(message)
    || /^(unable to|failed to) /i.test(message) || status >= 500) return fallback
  return message
}
