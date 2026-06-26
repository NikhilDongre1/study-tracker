import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'
import { useFirestore } from './hooks/useFirestore'
import { useClock, todayKey, keyForDate, formatClock, formatDateLong } from './hooks/useClock'
import SessionCard from './components/SessionCard'
import SessionEditor from './components/SessionEditor'
import Calendar from './components/Calendar'
import { useToast, Toast } from './components/Toast'
import { StatsPanel } from './components/Stats'
import { QUOTES } from './lib/quotes'


export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [viewDate, setViewDate] = useState(todayKey())
  const [editorMode, setEditorMode] = useState(null)
  const [noteVal, setNoteVal] = useState('')

  const now = useClock()
  const nowHour = now.getHours() + now.getMinutes() / 60
  const { msg, visible, showToast } = useToast()
  const userAvatar = user?.photoURL || 'https://www.google.com/favicon.ico'

  const { sessions, dayData, loading, error: firestoreError, saveSessions, saveDaySessions, toggleSession, saveNote, resetDay } = useFirestore(user?.uid)

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false) })
    return unsub
  }, [])


  // Sync note to viewDate
  useEffect(() => {
    setNoteVal(dayData[viewDate]?.note || '')
  }, [viewDate, dayData])

  useEffect(() => {
    if (!firestoreError) return
    if (firestoreError.code === 'permission-denied') {
      showToast('Update your Firestore security rules')
      return
    }
    showToast(firestoreError.message || 'Could not load Firestore data')
  }, [firestoreError, showToast])

  function changeDay(dir) {
    const d = new Date(viewDate + 'T00:00:00')
    d.setDate(d.getDate() + dir)
    const nextKey = keyForDate(d)
    if (nextKey > todayKey()) { showToast('Cannot go to future dates'); return }
    setViewDate(nextKey)
  }

  async function handleToggle(sessionId) {
    if (viewDate !== todayKey()) { showToast('You can only edit today\'s sessions'); return }
    try {
      await toggleSession(viewDate, sessionId)
    const data = dayData[viewDate] || {}
    const wasOff = !data.completed?.[sessionId]
    if (wasOff) showToast('Session marked complete ✓')
    else showToast('Unmarked')
    } catch (err) {
      console.error(err)
      showToast(err.code === 'permission-denied' ? 'Firestore rules are blocking this update' : 'Could not update task')
    }
  }

  async function handleSaveNote() {
    try {
      await saveNote(viewDate, noteVal)
      showToast('Note saved')
    } catch (err) {
      console.error(err)
      showToast(err.code === 'permission-denied' ? 'Firestore rules are blocking this note' : 'Could not save note')
    }
  }

  async function handleReset() {
    if (viewDate !== todayKey()) { showToast('Can only reset today'); return }
    if (window.confirm('Reset all sessions for today?')) {
      try {
        await resetDay(viewDate)
        showToast('Today reset')
      } catch (err) {
        console.error(err)
        showToast(err.code === 'permission-denied' ? 'Firestore rules are blocking reset' : 'Could not reset today')
      }
    }
  }

async function handleGoogleSignIn() {
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/popup-blocked') {
      showToast('Popup blocked — please allow popups for this site and try again')
      return
    }
    if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
      return
    }
    if (err.code === 'auth/configuration-not-found') {
      showToast('Enable Google sign-in in Firebase Authentication')
      return
    }
    showToast(err.message || 'Google sign-in failed')
  }
}

  const isToday = viewDate === todayKey()
  const data = dayData[viewDate] || {}
  const currentSessions = data.sessions?.length ? data.sessions : sessions

  const doneCount = currentSessions.filter(s => data.completed?.[s.id]).length
  const totalCount = currentSessions.length
  const completionPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0

  const activeDays = Object.entries(dayData).reduce((count, [key, value]) => {
    const daySessions = value.sessions?.length ? value.sessions : sessions
    const completedCount = daySessions.filter(s => value.completed?.[s.id]).length
    return completedCount > 0 ? count + 1 : count
  }, 0)

  const maxStreak = Object.keys(dayData)
    .sort()
    .reduce((state, key) => {
      const value = dayData[key]
      const daySessions = value.sessions?.length ? value.sessions : sessions
      const completedCount = daySessions.filter(s => value.completed?.[s.id]).length
      const streak = completedCount > 0 ? state.streak + 1 : 0
      return {
        streak,
        max: Math.max(state.max, streak),
      }
    }, { streak: 0, max: 0 }).max

  const quoteIndex = new Date(viewDate + 'T12:00:00').getDate() + new Date(viewDate + 'T12:00:00').getMonth() + new Date(viewDate + 'T12:00:00').getFullYear()
  const quote = QUOTES[quoteIndex % QUOTES.length]

  // ── AUTH SCREEN ──
  if (authLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading…</div>

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 20, padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Study Tracker</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
        Track your daily study sessions, streaks, and progress — synced across devices.
      </p>
      <button onClick={handleGoogleSignIn} style={{
        background: '#fff', color: '#111', border: 'none',
        padding: '12px 24px', borderRadius: 12,
        fontSize: 14, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <img src="https://www.google.com/favicon.ico" width={16} alt="" />
        Sign in with Google
      </button>
      <Toast msg={msg} visible={visible} />
    </div>
  )

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading your data…</div>

  if (firestoreError?.code === 'permission-denied') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Firestore access is blocked</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 420, lineHeight: 1.5 }}>
        Your Google sign-in worked, but Firestore rules are not allowing this user to read and write their own study data.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => window.location.reload()} style={{
          background: 'var(--purple-bg)', border: '1px solid var(--purple-dim)',
          color: 'var(--purple)', padding: '8px 14px', borderRadius: 8,
          fontSize: 12, cursor: 'pointer',
        }}>Reload after publishing rules</button>
        <button onClick={() => signOut(auth)} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text)', padding: '8px 14px', borderRadius: 8,
          fontSize: 12, cursor: 'pointer',
        }}>Sign out</button>
      </div>
      <Toast msg={msg} visible={visible} />
    </div>
  )

  // ── MAIN APP ──
  return (
    <>
      <div className="app-shell">

       <div className="header-row">
          <div>
            <div className="header-title">Study Tracker</div>
            <div className="date-label">{formatDateLong(viewDate)}</div>
          </div>
          <div className="header-meta">
            <div className="time-pill">{formatClock(now)}</div>
            <button onClick={() => changeDay(-1)} className="nav-btn">←</button>
            {!isToday && (
              <button onClick={() => setViewDate(todayKey())} className="nav-btn nav-btn-accent">
                Today
              </button>
            )}
            <button onClick={() => changeDay(1)} className="nav-btn">→</button>
            <img src={userAvatar} width={34} height={34} alt="Profile" className="avatar"
              onClick={() => { if (window.confirm('Sign out?')) signOut(auth) }}
              title="Click to sign out" />
          </div>
        </div>

      <div className="main-grid">
          <div className="tasks-panel">
            <div className="task-header">
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Tasks</div>
              <div className="task-buttons">
  <button onClick={() => setEditorMode('today')} className="task-btn">✎ Edit</button>
</div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {currentSessions.map(s => (
                <SessionCard key={s.id} session={s} done={!!data.completed?.[s.id]}
                  viewDate={viewDate} nowHour={nowHour} onToggle={handleToggle} />
              ))}
            </div>
          </div>

        <div className="stats-col">
  <StatsPanel sessions={sessions} dayData={dayData} viewDate={viewDate} />

  <div className="quote-text">"{quote}"</div>

  <div className="notes-inline">
    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>Daily note</div>
    <textarea
      value={noteVal}
      onChange={e => setNoteVal(e.target.value)}
      disabled={!isToday}
      placeholder={isToday ? 'What did you work on? Wins, blockers, insights…' : 'Read-only for past days'}
      className="notes-textarea"
    />
    {isToday && (
      <button onClick={handleSaveNote} className="notes-save-btn">Save note</button>
    )}
  </div>
</div>
        </div>

        <div className="heatmap-section">
          <Calendar sessions={sessions} dayData={dayData} viewDate={viewDate} onSelectDate={setViewDate} activeDays={activeDays} maxStreak={maxStreak} />
        </div>

       
      </div>

     {editorMode && (
  <SessionEditor
    sessions={currentSessions}
    title="Edit today's plan"
    saveLabel="Save"
    showDefaultOption={true}
    onSave={async (newSessions, setAsDefault) => {
      try {
        await saveDaySessions(viewDate, newSessions)
        if (setAsDefault) {
          await saveSessions(newSessions)
          showToast('Saved and set as default for upcoming days')
        } else {
          showToast('Today\'s plan saved')
        }
      } catch (err) {
        console.error(err)
        showToast(err.code === 'permission-denied' ? 'Firestore rules are blocking this update' : 'Could not save plan')
      } finally {
        setEditorMode(null)
      }
    }}
    onClose={() => setEditorMode(null)}
  />
)}

      <Toast msg={msg} visible={visible} />
    </>
  )
}

const navBtn = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text)', width: 32, height: 32, borderRadius: 8,
  cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const editorBtn = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
  fontSize: 13, minWidth: 130, textAlign: 'center', whiteSpace: 'nowrap',
}
