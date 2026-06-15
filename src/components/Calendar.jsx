import { useState } from 'react'
import { todayKey, keyForDate } from '../hooks/useClock'

export default function Calendar({ sessions, dayData, viewDate, onSelectDate }) {
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  function calNav(dir) {
    let m = calMonth + dir, y = calYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalMonth(m); setCalYear(y)
  }

  const today = todayKey()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  function dayStatus(key) {
    const d = dayData[key]
    if (!d) return 'none'
    const daySessions = d.sessions?.length ? d.sessions : sessions
    const done = daySessions.filter(s => d.completed?.[s.id]).length
    const total = daySessions.length
    if (done === total) return 'perfect'
    if (done > 0) return 'partial'
    return 'none'
  }

  const cellBase = {
    aspectRatio: '1', borderRadius: 8, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontFamily: 'var(--mono)',
    cursor: 'pointer', border: '1px solid transparent',
    position: 'relative', transition: 'all 0.1s',
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500 }}>{monthLabel}</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {['←','→'].map((ch, i) => (
            <button key={ch} onClick={() => calNav(i === 0 ? -1 : 1)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}>{ch}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted2)', paddingBottom: 6, fontWeight: 500, textTransform: 'uppercase' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={'e'+i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const d = new Date(calYear, calMonth, day)
          const key = keyForDate(d)
          const status = dayStatus(key)
          const isToday = key === today
          const isView = key === viewDate
          const isFuture = key > today

          let bg = 'transparent', color = 'var(--muted)', border = '1px solid transparent'
          if (status === 'perfect') { bg = '#0a2010'; color = '#4ade80'; border = '1px solid #22a84a55' }
          else if (status === 'partial') { bg = '#1f1500'; color = '#fbbf24'; border = '1px solid #5a401066' }
          if (isToday) border = '1px solid var(--purple)'
          if (isView) bg = isView && !isToday ? 'var(--surface2)' : bg
          if (isFuture) { color = 'var(--muted2)'; bg = 'transparent' }

          return (
            <div key={day} onClick={() => !isFuture && onSelectDate(key)}
              style={{ ...cellBase, background: bg, color, border }}>
              {day}
              {status !== 'none' && (
                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'currentColor' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        {[
          { color: '#4ade80', bg: '#0a2010', label: 'Perfect' },
          { color: '#fbbf24', bg: '#1f1500', label: 'Partial' },
          { color: 'var(--purple)', bg: 'transparent', label: 'Today', border: true },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: l.border ? '1px solid var(--purple)' : `1px solid ${l.color}44` }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
