import { useState, useEffect, useCallback, useRef } from 'react'
import {
  doc, setDoc, onSnapshot, collection, runTransaction
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { DEFAULT_SESSIONS } from '../lib/defaults'
import { normalizeSessions } from '../lib/sessionUtils'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function useFirestore(userId) {
  const [sessions, setSessions] = useState(normalizeSessions(DEFAULT_SESSIONS))
  const [dayData, setDayData] = useState({})   // { [dateKey]: { sessions: [], completed: {}, note: '' } }
  const [loading, setLoading] = useState(true)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [daysLoaded, setDaysLoaded] = useState(false)
  const [configSynced, setConfigSynced] = useState(false)
  const [daysSynced, setDaysSynced] = useState(false)
  const [error, setError] = useState(null)

  // Load session config (user's custom sessions)
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setError(null)
    setConfigLoaded(false)
    setConfigSynced(false)
    const ref = doc(db, 'users', userId, 'config', 'sessions')
    const unsub = onSnapshot(
      ref,
      snap => {
        if (snap.exists()) setSessions(normalizeSessions(snap.data().list || []))
        else setSessions(normalizeSessions(DEFAULT_SESSIONS))
        setConfigLoaded(true)
        if (!snap.metadata.fromCache) setConfigSynced(true)
      },
      err => {
        console.error(err)
        setError(err)
        setConfigLoaded(true)
      }
    )
    return unsub
  }, [userId])

  // Create today's task list from the default template the first time the day appears.
  const initializedDays = useRef(new Set())

useEffect(() => {
  if (!userId || !configSynced || !daysSynced || !sessions.length) return
  
  const key = todayKey()
  const initializationKey = `${userId}:${key}`
  if (initializedDays.current.has(initializationKey)) return
  initializedDays.current.add(initializationKey)
  const existing = dayData[key]
  
  // Already has sessions saved for today — never overwrite
  if (existing?.sessions?.length) {
    return
  }
  
  // Only init once per app session, not on every sessions/dayData change
  const ref = doc(db, 'users', userId, 'days', key)
  runTransaction(db, async transaction => {
    const remoteDay = await transaction.get(ref)
    if (remoteDay.exists()) return

    transaction.set(ref, {
      completed: {},
      note: '',
      sessions: normalizeSessions(sessions),
    })
  }).catch(err => {
    // Do not fall back to setDoc: an offline transaction fails instead of
    // queueing a write based on incomplete cached data.
    console.warn('Could not initialize today\'s tasks safely', err)
  })
}, [userId, configSynced, daysSynced, sessions, dayData])

  // Load all day data for this user (listen to changes)
  useEffect(() => {
    if (!userId) return
    setDaysLoaded(false)
    setDaysSynced(false)
    const col = collection(db, 'users', userId, 'days')
    const unsub = onSnapshot(
      col,
      snap => {
        const data = {}
        snap.forEach(d => { data[d.id] = d.data() })
        setDayData(data)
        setDaysLoaded(true)
        if (!snap.metadata.fromCache) setDaysSynced(true)
      },
      err => {
        console.error(err)
        setError(err)
        setDaysLoaded(true)
      }
    )
    return unsub
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(!(configLoaded && daysLoaded))
  }, [userId, configLoaded, daysLoaded])

const saveSessions = useCallback(async (newSessions) => {
  if (!userId) return
  const ref = doc(db, 'users', userId, 'config', 'sessions')
  await setDoc(ref, { list: normalizeSessions(newSessions) })
}, [userId])

  const saveDaySessions = useCallback(async (dateKey, newSessions) => {
    if (!userId) return
    const existing = dayData[dateKey] || { completed: {}, note: '' }
    const sessionIds = new Set(newSessions.map(s => s.id))
    const completed = Object.fromEntries(
      Object.entries(existing.completed || {}).filter(([id]) => sessionIds.has(id))
    )
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { ...existing, sessions: normalizeSessions(newSessions), completed }, { merge: true })
  }, [userId, dayData])

  const toggleSession = useCallback(async (dateKey, sessionId) => {
    if (!userId) return
    const existing = dayData[dateKey] || { completed: {}, note: '', sessions }
    const nextValue = !existing.completed?.[sessionId]
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, {
      sessions: normalizeSessions(existing.sessions || sessions),
      completed: { [sessionId]: nextValue },
    }, { merge: true })
  }, [userId, dayData, sessions])

  const saveNote = useCallback(async (dateKey, note) => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { note }, { merge: true })
  }, [userId])

  const resetDay = useCallback(async (dateKey) => {
    if (!userId) return
    const existing = dayData[dateKey] || {}
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { ...existing, completed: {}, note: '' })
  }, [userId, dayData])

  return { sessions, dayData, loading, error, saveSessions, saveDaySessions, toggleSession, saveNote, resetDay }
}
