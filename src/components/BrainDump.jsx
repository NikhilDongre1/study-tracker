import { useState } from 'react'

// Simple inbox column (old session model — no modes, no per-day picker, no times).
// One click appends an item to today, auto-scheduled after the day's last task.
export default function BrainDump({ items, onAdd, onAddToToday, onDelete }) {
  const [title, setTitle] = useState('')

  function submit() {
    const name = title.trim()
    if (!name) return
    onAdd({
      id: 'b' + Date.now().toString(36),
      name,
      desc: '',
      timeStart: '09:00',
      timeEnd: '09:30',
      color: '#a78bfa',
      type: 'Deep Work',
    })
    setTitle('')
  }

  return (
    <div className="braindump-panel">
      <div className="task-header">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          🧠 Brain Dump {(items || []).length > 0 && <span style={{ opacity: 0.7 }}>· {items.length}</span>}
        </div>
      </div>

      <div className="dump-add">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Dump it here…"
          aria-label="Add to brain dump"
        />
        <button onClick={submit} disabled={!title.trim()}>Add</button>
      </div>

      <div className="dump-list">
        {(items || []).length === 0 && (
          <div className="dump-empty">Empty. Dump raw ideas here, schedule them with one click.</div>
        )}
        {(items || []).map(t => (
          <div key={t.id} className="dump-item">
            <div className="dump-item-info">
              <div className="dump-item-name" title={t.name}>{t.name}</div>
            </div>
            <button
              className="dump-today-btn"
              onClick={() => onAddToToday(t.id)}
              title="Add to today's list"
            >
              + Today
            </button>
            <button className="dump-del-btn" onClick={() => onDelete(t.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
