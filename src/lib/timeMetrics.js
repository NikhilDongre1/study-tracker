// Pure date math for the Year / Month / Week / Life meters.
// All calculations use local timezone day boundaries.

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date - start) / 86400000) + 1
}

export function yearProgress(date = new Date()) {
  const year = date.getFullYear()
  const total = isLeapYear(year) ? 366 : 365
  const elapsed = Math.min(dayOfYear(date), total)
  const pct = Math.round((elapsed / total) * 1000) / 10
  return { year, total, elapsed, left: total - elapsed, pct }
}

export function monthProgress(date = new Date()) {
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const elapsed = Math.min(date.getDate(), total)
  const pct = Math.round((elapsed / total) * 1000) / 10
  return { total, elapsed, left: total - elapsed, pct }
}

export function weekProgress(date = new Date()) {
  // Monday-first week
  const dow = (date.getDay() + 6) % 7 // Mon=0..Sun=6
  const elapsed = dow + 1
  return { total: 7, elapsed, left: 7 - elapsed, pct: Math.round((elapsed / 7) * 1000) / 10 }
}

export const LIFE_YEARS = 80
export const LIFE_WEEKS = LIFE_YEARS * 52 // 4160 — the Wait-But-Why / LifeWeeks standard

// birthdate: 'YYYY-MM-DD' | Date | null
export function lifeProgress(birthdate, now = new Date()) {
  if (!birthdate) return null
  const born = birthdate instanceof Date ? birthdate : new Date(birthdate + 'T12:00:00')
  if (Number.isNaN(born.getTime())) return null
  const totalDays = LIFE_YEARS * 365.25
  const livedDays = Math.max(0, Math.floor((now - born) / 86400000))
  const livedWeeks = Math.min(LIFE_WEEKS, Math.floor(livedDays / 7))
  const pct = Math.min(100, Math.round((livedDays / totalDays) * 1000) / 10)
  const ageYears = Math.floor(livedDays / 365.25)
  return {
    livedWeeks,
    leftWeeks: LIFE_WEEKS - livedWeeks,
    livedDays,
    pct,
    ageYears,
  }
}
