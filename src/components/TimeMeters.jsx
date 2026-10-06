import { useState, useRef, useEffect } from 'react'
import { yearProgress, lifeProgress, LIFE_YEARS, LIFE_WEEKS } from '../lib/timeMetrics'

// Year-only dot meter — sits beside the heatmap, stretched to the same height.
export function YearMeter() {
  const now = new Date()
  const data = yearProgress(now)

  return (
    <div className="ym-meter">
      <div className="ym-head">
        <strong>{data.year}</strong>
        <span className="ym-pct">{data.pct}%</span>
      </div>
      <DotGrid total={data.total} filled={data.elapsed} now={data.elapsed - 1} size="xs" />
      <div className="ym-sub">{data.elapsed}/{data.total} days · {data.left} left</div>
    </div>
  )
}

// Full-width life grid with the tiniest possible birthdate edit affordance.
export function LifeMeter({ birthdate, onSaveBirthdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(birthdate || '')
  const life = lifeProgress(birthdate, new Date())

  function save() {
    if (!draft) return
    onSaveBirthdate(draft)
    setEditing(false)
  }

  return (
    <div className="life-full">
      <div className="life-head">
        <div>
          <strong>Life · {LIFE_YEARS} years</strong>
          <span className="life-sub">
            {life
              ? ` age ${life.ageYears} · week ${life.livedWeeks.toLocaleString()}/${LIFE_WEEKS.toLocaleString()} · ${life.pct}% lived`
              : ' — add your birthdate to light it up'}
          </span>
        </div>
        <button
          className="tiny-edit"
          onClick={() => { setDraft(birthdate || ''); setEditing(e => !e) }}
          title={birthdate ? `Born ${birthdate} — click to change` : 'Set birthdate'}
        >
          ✎
        </button>
      </div>

      {editing && (
        <div className="life-edit-row">
          <input type="date" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Birthdate" />
          <button className="notes-save-btn" onClick={save} disabled={!draft}>Save</button>
          <button className="tiny-edit" onClick={() => setEditing(false)} title="Close">✕</button>
        </div>
      )}

      {life ? (
        <LifeGrid total={LIFE_WEEKS} filled={life.livedWeeks} now={life.livedWeeks} />
      ) : (
        !editing && (
          <div className="life-edit-row">
            <input type="date" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Birthdate" />
            <button className="notes-save-btn" onClick={save} disabled={!draft}>Show my life</button>
          </div>
        )
      )}
    </div>
  )
}

export function DotGrid({ total, filled, now, size = 'sm', dense = false, life = false }) {
  return (
    <div className={`dot-grid ${size}${dense ? ' dense' : ''}${life ? ' life-dots' : ''}`} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`dot${i < filled ? ' fill' : ''}${i === now ? ' now' : ''}`}
        />
      ))}
    </div>
  )
}

// Short, wide life band — weeks flow column-first (each column completes
// top-to-bottom, columns advance left-to-right) and the row count is picked
// so the band's height matches the heatmap's dots.
const LIFE_GAP = 2
const MIN_DOT = 3

function pickRows(width, targetH, total = LIFE_WEEKS) {
  let best = 44 // fallback: fewest columns = biggest dots
  let bestDiff = Infinity
  let found = false
  for (let r = 8; r <= 44; r++) {
    const c = Math.ceil(total / r)
    const d = (width - (c - 1) * LIFE_GAP) / c
    if (d < MIN_DOT) continue
    const h = r * d + (r - 1) * LIFE_GAP
    const diff = Math.abs(h - targetH)
    if (diff < bestDiff) { bestDiff = diff; best = r; found = true }
  }
  return { rows: found ? best : 44 }
}

export function LifeGrid({ total, filled, now }) {
  const gridRef = useRef(null)
  const [rows, setRows] = useState(20)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    function recalc() {
      const w = el.offsetWidth || 1200
      const heat = document.querySelector('.heatmap-grid')
      const h = heat?.offsetHeight || 170
      setRows(pickRows(w, h, total).rows)
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    window.addEventListener('resize', recalc)
    return () => { ro.disconnect(); window.removeEventListener('resize', recalc) }
  }, [total])

  return (
    <div
      ref={gridRef}
      className="life-grid"
      style={{ '--life-rows': rows }}
      aria-hidden
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`dot${i < filled ? ' fill' : ''}${i === now ? ' now' : ''}`}
        />
      ))}
    </div>
  )
}

export default YearMeter
