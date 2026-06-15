import { todayKey, keyForDate } from '../hooks/useClock'

export function SummaryBar({ sessions, dayData, viewDate }) {
  const data = dayData[viewDate] || {}
  const done = sessions.filter(s => data.completed?.[s.id]).length
  const pct = sessions.length ? Math.round((done / sessions.length) * 100) : 0
  const hrs = sessions.filter(s => data.completed?.[s.id]).reduce((a, s) => a + s.hours, 0)
  const streak = calcStreak(sessions, dayData)

  const cards = [
    { val: done, label: 'Sessions done', color: 'var(--purple)' },
    { val: pct + '%', label: 'Completion', color: '#4ade80' },
    { val: hrs + 'h', label: 'Hours logged', color: 'var(--blue)' },
    { val: streak + '🔥', label: 'Day streak', color: '#fbbf24' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)', color: c.color, lineHeight: 1 }}>{c.val}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

export function ProgressRing({ sessions, dayData, viewDate }) {
  const data = dayData[viewDate] || {}
  const done = sessions.filter(s => data.completed?.[s.id]).length
  const total = sessions.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const circumference = 232.5
  const offset = circumference - (pct / 100) * circumference

  const titles = ['Let\'s get started', 'Good start!', 'Building momentum', 'More than halfway!', 'Almost done!', 'Perfect day! 🔥']
  const subs = [
    'Tap a session below when you finish it.',
    'First block done. Keep the momentum.',
    'Strong work. Keep going.',
    'Over halfway. You\'re in flow.',
    'One session left. Finish strong.',
    'All sessions complete. Incredible day.',
  ]

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r="37" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle cx="45" cy="45" r="37" fill="none" stroke="var(--purple)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--purple)' }}>{pct}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{done}/{total}</div>
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{titles[Math.min(done, 5)]}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{subs[Math.min(done, 5)]}</p>
      </div>
    </div>
  )
}

export function StreakCards({ sessions, dayData }) {
  const streak = calcStreak(sessions, dayData)
  const perfect = countPerfectMonth(sessions, dayData)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      {[
        { label: 'Current streak', val: streak, sub: 'days in a row', color: '#fbbf24' },
        { label: 'Perfect days this month', val: perfect, sub: 'all sessions done', color: '#4ade80' },
      ].map(c => (
        <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--mono)', color: c.color }}>{c.val}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{c.sub}</div>
        </div>
      ))}
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
    const done = sessions.filter(s => data.completed?.[s.id]).length
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
    if (sessions.length > 0 && sessions.every(s => data.completed?.[s.id])) count++
  }
  return count
}
