import { useState } from 'react'
import { ACCENT_COLORS, SESSION_TYPES, DEFAULT_SESSIONS } from '../lib/defaults'

export default function SessionEditor({ sessions, onSave, onClose }) {
  const [list, setList] = useState(sessions.map(s => ({ ...s })))
  const [editingId, setEditingId] = useState(null)
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  const editing = list.find(s => s.id === editingId)

  function updateField(id, field, value) {
    setList(l => l.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function addSession() {
    const newId = 's' + Date.now()
    setList(l => [...l, {
      id: newId,
      name: 'New Block',
      desc: '',
      timeStart: '08:00',
      timeEnd: '10:00',
      hours: 2,
      color: '#a78bfa',
      type: 'Deep Work',
    }])
    setEditingId(newId)
  }

  function removeSession(id) {
    setList(l => l.filter(s => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function moveSession(id, dir) {
    const idx = list.findIndex(s => s.id === id)
    if (idx + dir < 0 || idx + dir >= list.length) return
    const newList = [...list]
    ;[newList[idx], newList[idx + dir]] = [newList[idx + dir], newList[idx]]
    setList(newList)
  }

  const inputStyle = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border2)', borderRadius: 8,
    color: 'var(--text)', padding: '8px 10px',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
    marginTop: 4,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 18, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflow: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Edit Today's Tasks</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Session list */}
        {list.map((s, i) => (
          <div key={s.id} style={{
            border: `1px solid ${editingId === s.id ? s.color + '66' : 'var(--border)'}`,
            borderRadius: 12, marginBottom: 8, overflow: 'hidden',
          }}>
            {/* Row header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', cursor: 'pointer',
                background: editingId === s.id ? s.color + '10' : 'transparent',
              }}
              onClick={() => setEditingId(editingId === s.id ? null : s.id)}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{s.timeStart}–{s.timeEnd}</span>
              <button onClick={e => { e.stopPropagation(); moveSession(s.id, -1) }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 3px' }}>↑</button>
              <button onClick={e => { e.stopPropagation(); moveSession(s.id, 1) }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 3px' }}>↓</button>
              <button onClick={e => { e.stopPropagation(); removeSession(s.id) }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>

            {/* Expanded editor */}
            {editingId === s.id && (
              <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Block name</label>
                  <input style={inputStyle} value={s.name}
                    onChange={e => updateField(s.id, 'name', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Description (optional)</label>
                  <input style={inputStyle} value={s.desc}
                    onChange={e => updateField(s.id, 'desc', e.target.value)}
                    placeholder="e.g. DSA / LeetCode" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Start time</label>
                  <input style={inputStyle} type="time" value={s.timeStart}
                    onChange={e => updateField(s.id, 'timeStart', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>End time</label>
                  <input style={inputStyle} type="time" value={s.timeEnd}
                    onChange={e => updateField(s.id, 'timeEnd', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Hours</label>
                  <input style={inputStyle} type="number" step="0.5" min="0.5" max="12" value={s.hours}
                    onChange={e => updateField(s.id, 'hours', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Type</label>
                  <select style={{ ...inputStyle, appearance: 'auto' }} value={s.type}
                    onChange={e => updateField(s.id, 'type', e.target.value)}>
                    {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(c => (
                      <div key={c} onClick={() => updateField(s.id, 'color', c)}
                        style={{
                          width: 24, height: 24, borderRadius: '50%', background: c,
                          cursor: 'pointer', border: s.color === c ? '2px solid #fff' : '2px solid transparent',
                          boxShadow: s.color === c ? `0 0 0 2px ${c}` : 'none',
                        }} />
                    ))}
                    <input type="color" value={s.color}
                      onChange={e => updateField(s.id, 'color', e.target.value)}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add + actions */}
        <button onClick={addSession} style={{
          width: '100%', padding: '10px', background: 'var(--surface2)',
          border: '1px dashed var(--border2)', borderRadius: 10,
          color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginTop: 4,
        }}>+ Add task</button>

        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          marginTop: 14, color: 'var(--muted)', fontSize: 12,
          lineHeight: 1.4, cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={e => setSaveAsDefault(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>Use this list as my default for new days</span>
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => { if (confirm('Reset to default tasks?')) setList(DEFAULT_SESSIONS.map(s => ({ ...s }))) }}
            style={{
              flex: 1, padding: '10px', background: 'none',
              border: '1px solid var(--border)', borderRadius: 10,
              color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
            }}>Reset defaults</button>
          <button onClick={() => onSave(list, saveAsDefault)}
            style={{
              flex: 2, padding: '10px', background: 'var(--purple)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Save tasks</button>
        </div>
      </div>
    </div>
  )
}
