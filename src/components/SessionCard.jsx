import { parseHHMM, todayKey } from '../hooks/useClock'

export default function SessionCard({ session, done, viewDate, nowHour, onToggle }) {
  const isToday = viewDate === todayKey()
  const active = isToday &&
    nowHour >= parseHHMM(session.timeStart) &&
    nowHour < parseHHMM(session.timeEnd)

  return (
    <div
      onClick={() => onToggle(session.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 14,
        marginBottom: 8,
        cursor: 'pointer',
        border: `1px solid ${done ? session.color + '55' : active ? session.color + '44' : 'var(--border)'}`,
        background: done
          ? session.color + '12'
          : active
          ? session.color + '0a'
          : 'var(--surface)',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Check circle */}
      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        border: `2px solid ${done ? session.color : active ? session.color + '88' : 'var(--border2)'}`,
        background: done ? session.color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: active && !done ? `0 0 0 3px ${session.color}22` : 'none',
        animation: active && !done ? 'pulse 2s infinite' : 'none',
        transition: 'all 0.2s',
      }}>
        {done ? '✓' : ''}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
          {session.name}
          {session.desc && (
            <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
              — {session.desc}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 12,
          color: done ? session.color : 'var(--muted)',
          fontFamily: 'var(--mono)',
          marginTop: 3,
        }}>
          {session.timeStart} – {session.timeEnd}
          <span style={{ marginLeft: 10, opacity: 0.7 }}>{session.hours}h</span>
        </div>
      </div>

      {/* Right badge */}
      {done ? (
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: session.color + '22', color: session.color,
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>Done ✓</span>
      ) : active ? (
        <span style={{
          fontSize: 11, color: session.color,
          fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
          animation: 'blink 1.5s infinite',
        }}>● Now</span>
      ) : (
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: session.color + '15', color: session.color + 'cc',
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>{session.type}</span>
      )}
    </div>
  )
}
