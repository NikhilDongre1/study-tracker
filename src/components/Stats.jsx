import { todayKey, keyForDate } from '../hooks/useClock'
import { calculateSessionHours } from '../lib/sessionUtils'

// Compact stats panel for the right column (6:4 split with tasks).
// Stacks vertically: 2x2 mini-stat grid + current streak line.
export function StatsPanel({ sessions, dayData, viewDate }) {
  const data = dayData[viewDate] || {}
  const daySessions = data.sessions?.length ? data.sessions : sessions
  const done = daySessions.filter(s => data.completed?.[s.id]).length
  const total = daySessions.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const hrs = daySessions
    .filter(s => data.completed?.[s.id])
    .reduce((a, s) => a + calculateSessionHours(s.timeStart, s.timeEnd), 0)
  const streak = calcStreak(sessions, dayData)
  const perfect = countPerfectMonth(sessions, dayData)

  const circumference = 175.9 // 2 * PI * 28
  const offset = circumference - (pct / 100) * circumference

  const miniStats = [
    { val: done, label: 'Done today', color: 'var(--purple)' },
    { val: hrs.toFixed(1) + 'h', label: 'Hours logged', color: 'var(--blue)' },
  ]

  return (
    <div className="stats-panel">
      {/* Ring + completion */}
      <div className="stats-ring-row">
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--purple)"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--purple)' }}>{pct}%</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{done}/{total} sessions</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>completed today</div>
        </div>
      </div>

      {/* Mini stat grid */}
      <div className="stats-mini-grid">
        {miniStats.map(s => (
          <div key={s.label} className="stats-mini-card">
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="stats-streak-row">
        <div className="stats-streak-card">
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current streak</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)', color: '#fbbf24', marginTop: 4 }}>{streak}🔥</div>
        </div>
        <div className="stats-streak-card">
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Perfect days</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)', color: '#4ade80', marginTop: 4 }}>{perfect}</div>
        </div>
      </div>
    </div>
  )
}

function calcStreak(sessions, dayData) {
  let streak = 0
  const d = new Date()
  const today = todayKey()
  for (let i = 0; i < 365; i++) {
    const key = keyForDate(d)
    const data = dayData[key] || {}
    const daySessions = data.sessions?.length ? data.sessions : sessions
    const done = daySessions.filter(s => data.completed?.[s.id]).length
    if (done === 0 && key !== today) break
    if (done > 0) streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function countPerfectMonth(sessions, dayData) {
  const now = new Date()
  let count = 0
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day)
    const key = keyForDate(d)
    const data = dayData[key] || {}
    const daySessions = data.sessions?.length ? data.sessions : sessions
    if (daySessions.length > 0 && daySessions.every(s => data.completed?.[s.id])) count++
  }
  return count
}