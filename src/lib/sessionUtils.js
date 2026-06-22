export function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return 0
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

export function calculateSessionHours(timeStart, timeEnd) {
  const start = parseTimeToMinutes(timeStart)
  const end = parseTimeToMinutes(timeEnd)
  const duration = end >= start ? end - start : end + 24 * 60 - start
  return Math.round((duration / 60) * 100) / 100
}

export function normalizeSession(session) {
  return {
    ...session,
    hours: calculateSessionHours(session.timeStart, session.timeEnd),
  }
}

export function normalizeSessions(sessions) {
  return sessions.map(normalizeSession)
}
