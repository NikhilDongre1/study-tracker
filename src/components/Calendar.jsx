import { useMemo, useRef, useState, useEffect } from 'react'
import { todayKey, keyForDate } from '../hooks/useClock'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HEAT_COLORS = ['#26262c', '#224d24', '#2a7f34', '#35b55a', '#7ee8a0']
const FUTURE_COLOR = '#1c1c20'

const MIN_CELL = 10
const MAX_CELL = 16
const GAP_RATIO = 0.25 // gap as a fraction of cell size

export default function Calendar({ sessions, dayData, viewDate, onSelectDate, activeDays, maxStreak }) {
  const wrapperRef = useRef(null)
  const [cellSize, setCellSize] = useState(13)

  useEffect(() => {
    function recalc() {
      if (!wrapperRef.current) return
      const width = wrapperRef.current.offsetWidth
      // 53 columns, each column = cell + gap, solve for cell size that fills width
      const raw = width / (53 + 53 * GAP_RATIO)
      const clamped = Math.max(MIN_CELL, Math.min(MAX_CELL, raw))
      setCellSize(clamped)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  const gap = Math.round(cellSize * GAP_RATIO)
  const colWidth = cellSize + gap

  const today = new Date()
  const year = today.getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)

  const firstDisplayDay = useMemo(() => {
    const start = new Date(yearStart)
    start.setDate(start.getDate() - start.getDay())
    return start
  }, [yearStart])

  const weeks = useMemo(() => {
    const cols = []
    const date = new Date(firstDisplayDay)
    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        week.push(new Date(date))
        date.setDate(date.getDate() + 1)
      }
      cols.push(week)
    }
    return cols
  }, [firstDisplayDay])

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    weeks.forEach((week, index) => {
      week.forEach(date => {
        if (date < yearStart || date > yearEnd) return
        const month = date.getMonth()
        if (month !== lastMonth) {
          labels.push({ index, label: MONTH_NAMES[month] })
          lastMonth = month
        }
      })
    })
    return labels
  }, [weeks, yearStart, yearEnd])

  function isWithinYear(date) {
    return date >= yearStart && date <= yearEnd
  }

function dayStats(key) {
  const sessionDay = dayData[key]
  if (!sessionDay) return { done: 0, total: 0, intensity: 0 }
  const daySessions = sessionDay.sessions?.length ? sessionDay.sessions : sessions
  if (!daySessions.length) return { done: 0, total: 0, intensity: 0 }
  const done = daySessions.filter(s => sessionDay.completed?.[s.id]).length
  const pct = done / daySessions.length
  // 5 buckets (0–4) based on % completion, not a fixed "out of 4" count
  const intensity = done === 0 ? 0 : Math.min(4, Math.ceil(pct * 4))
  return { done, total: daySessions.length, intensity }
}

  return (
    <div className="heatmap-section">
      <div className="heatmap-grid-wrapper" ref={wrapperRef}>
        <div className="month-labels" style={{ width: weeks.length * colWidth, height: cellSize + 2 }}>
          {monthLabels.map(label => (
            <div
              key={label.label + label.index}
              className="month-label"
              style={{ left: label.index * colWidth }}
            >
              {label.label}
            </div>
          ))}
        </div>

        <div
          className="heatmap-grid"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
            gap,
            width: weeks.length * colWidth,
          }}
        >
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="heatmap-column"
              style={{ gridTemplateRows: `repeat(7, ${cellSize}px)`, gap }}
            >
           {week.map(day => {
  const key = keyForDate(day)
  const active = isWithinYear(day)
  const { done, total, intensity } = active ? dayStats(key) : { done: 0, total: 0, intensity: 0 }
  const isSelected = key === viewDate
  const bg = active ? HEAT_COLORS[intensity] : FUTURE_COLOR

  return (
    <div
      key={key}
      onClick={() => active && day <= today && onSelectDate(key)}
      title={active ? `${day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${total === 0 ? 'no sessions planned' : `${done}/${total} sessions completed`}` : ''}
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: 3,
        background: bg,
        border: isSelected ? '2px solid var(--purple)' : '1px solid transparent',
        cursor: active && day <= today ? 'pointer' : 'default',
        opacity: day > today ? 0.35 : 1,
        transition: 'transform 0.15s ease, background-color 0.15s ease',
      }}
    />
  )
})}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-footer">Total active days: {activeDays} • Max streak: {maxStreak}</div>
    </div>
  )
}