import { useState } from 'react'

function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const examDate = new Date(`${date}T00:00:00`)
  return Math.round((examDate - today) / 86400000)
}

function countdownLabel(date) {
  const days = daysUntil(date)
  if (days < 0) return 'Passed'
  if (days === 0) return 'Today'
  return `${days} day${days === 1 ? '' : 's'} left`
}

export default function ExamCountdown({ exams, onSave }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const sortedExams = [...(exams || [])].sort((a, b) => a.date.localeCompare(b.date))

  function submit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || !date) return
    const nextExams = editingId && editingId !== 'new'
      ? (exams || []).map(exam => exam.id === editingId ? { ...exam, name: trimmedName, date } : exam)
      : [...(exams || []), { id: `e${Date.now().toString(36)}`, name: trimmedName, date }]
    onSave(nextExams)
    closeEditor()
  }

  function closeEditor() {
    setName('')
    setDate('')
    setEditingId(null)
  }

  function editExam(exam) {
    setName(exam.name)
    setDate(exam.date)
    setEditingId(exam.id)
  }

  return (
    <section className="target-panel" aria-labelledby="target-heading">
      <div className="task-header">
        <div className="target-heading">
          <div className="target-kicker">Next Up</div>
          <div id="target-heading" className="target-subtitle">Dates and goals on your horizon</div>
        </div>
        <button className="exam-edit-btn" onClick={() => editingId ? closeEditor() : setEditingId('new')} title="Add a target" aria-label="Add a target">
          ✎
        </button>
      </div>

      {editingId && <form className="exam-add" onSubmit={submit}>
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Target name"
          aria-label="Target name"
        />
        <input
          value={date}
          onChange={event => setDate(event.target.value)}
          type="date"
          aria-label="Target date"
        />
        <div className="exam-form-actions">
          <button type="submit" disabled={!name.trim() || !date}>{editingId === 'new' ? 'Add target' : 'Save target'}</button>
          <button type="button" className="exam-cancel-btn" onClick={closeEditor}>Cancel</button>
        </div>
      </form>}

      <div className="exam-list">
        {sortedExams.length === 0 ? (
          <div className="exam-empty">Add a target to keep its date in sight.</div>
        ) : sortedExams.map(exam => (
          <div key={exam.id} className="exam-item">
            <span className="exam-name" title={exam.name}>{exam.name}</span>
            <span className={`exam-days${daysUntil(exam.date) < 0 ? ' exam-passed' : ''}`}>
              {countdownLabel(exam.date)}
            </span>
            <button className="exam-edit-btn" onClick={() => editExam(exam)} title={`Edit ${exam.name}`} aria-label={`Edit ${exam.name}`}>
              ✎
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
