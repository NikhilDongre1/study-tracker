import { useState, useEffect } from 'react'
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'
import { useFirestore } from './hooks/useFirestore'
import { useClock, todayKey, keyForDate, formatClock, formatDateLong } from './hooks/useClock'
import SessionCard from './components/SessionCard'
import SessionEditor from './components/SessionEditor'
import Calendar from './components/Calendar'
import { SummaryBar, ProgressRing, StreakCards } from './components/Stats'
import { useToast, Toast } from './components/Toast'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [viewDate, setViewDate] = useState(todayKey())
  const [showEditor, setShowEditor] = useState(false)
  const [noteVal, setNoteVal] = useState('')

  const now = useClock()
  const nowHour = now.getHours() + now.getMinutes() / 60
  const { msg, visible, showToast } = useToast()

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
    const d = new Date(viewDate + 'T12:00:00')
    d.setDate(d.getDate() + dir)
    if (d > new Date()) { showToast('Cannot go to future dates'); return }
    setViewDate(keyForDate(d))
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
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
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
      {/* HEADER */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Study Tracker</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--purple)',
            background: 'var(--purple-bg)', padding: '6px 14px', borderRadius: 8,
            border: '1px solid var(--purple-dim)', letterSpacing: 1,
          }}>{formatClock(now)}</div>
          <img src={user.photoURL} width={30} height={30}
            style={{ borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer' }}
            onClick={() => { if (window.confirm('Sign out?')) signOut(auth) }}
            title="Click to sign out" alt="avatar" />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* DATE NAV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0 16px' }}>
          <button onClick={() => changeDay(-1)} style={navBtn}>←</button>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
            {isToday ? 'Today — ' : ''}{formatDateLong(viewDate)}
          </span>
          {!isToday && <button onClick={() => setViewDate(todayKey())} style={{ ...navBtn, color: 'var(--purple)', borderColor: 'var(--purple-dim)', background: 'var(--purple-bg)', width: 'auto', padding: '0 12px', fontSize: 12 }}>Today</button>}
          <button onClick={() => changeDay(1)} style={navBtn}>→</button>
        </div>

        {/* STATS */}
        <SummaryBar sessions={currentSessions} dayData={dayData} viewDate={viewDate} />
        <ProgressRing sessions={currentSessions} dayData={dayData} viewDate={viewDate} />

        {/* SESSIONS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tasks</div>
          {isToday && <button onClick={() => setShowEditor(true)} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
            fontSize: 11, padding: '4px 12px', borderRadius: 8, cursor: 'pointer',
          }}>✎ Edit tasks</button>}
        </div>

        {currentSessions.map(s => (
          <SessionCard key={s.id} session={s} done={!!data.completed?.[s.id]}
            viewDate={viewDate} nowHour={nowHour} onToggle={handleToggle} />
        ))}

        {/* STREAK */}
        <div style={{ marginTop: 28 }}>
          <StreakCards sessions={sessions} dayData={dayData} />
        </div>

        {/* CALENDAR */}
        <Calendar sessions={sessions} dayData={dayData} viewDate={viewDate} onSelectDate={setViewDate} />

        {/* NOTE */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 500 }}>Daily note</div>
          <textarea
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            disabled={!isToday}
            placeholder={isToday ? 'What did you work on? Wins, blockers, insights…' : 'Read-only for past days'}
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontFamily: 'inherit',
              fontSize: 13, padding: '10px 12px', resize: 'vertical', minHeight: 72,
              outline: 'none', lineHeight: 1.5, opacity: isToday ? 1 : 0.6,
            }}
          />
          {isToday && (
            <button onClick={handleSaveNote} style={{
              marginTop: 8, background: 'var(--purple-bg)', border: '1px solid var(--purple-dim)',
              color: 'var(--purple)', padding: '6px 16px', borderRadius: 8,
              fontSize: 12, cursor: 'pointer',
            }}>Save note</button>
          )}
        </div>

        {/* RESET */}
        {isToday && (
          <div style={{ textAlign: 'right' }}>
            <button onClick={handleReset} style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
              fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            }}>Reset today</button>
          </div>
        )}
      </div>

      {showEditor && (
        <SessionEditor
          sessions={currentSessions}
          onSave={async (newSessions, saveAsDefault) => {
            await saveDaySessions(viewDate, newSessions)
            if (saveAsDefault) await saveSessions(newSessions)
            setShowEditor(false)
            showToast(saveAsDefault ? 'Tasks saved and set as default' : 'Today\'s tasks saved')
          }}
          onClose={() => setShowEditor(false)}
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
