import { useState, useEffect, useCallback } from 'react'
import {
  doc, setDoc, onSnapshot, collection
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
  const [error, setError] = useState(null)

  // Load session config (user's custom sessions)
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setError(null)
    setConfigLoaded(false)
    const ref = doc(db, 'users', userId, 'config', 'sessions')
    const unsub = onSnapshot(
      ref,
      snap => {
        if (snap.exists()) setSessions(normalizeSessions(snap.data().list || []))
        else setSessions(normalizeSessions(DEFAULT_SESSIONS))
        setConfigLoaded(true)
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
  useEffect(() => {
    if (!userId || !configLoaded || !daysLoaded || !sessions.length) return

    const key = todayKey()
    const existing = dayData[key]
    if (existing?.sessions?.length) return

    const ref = doc(db, 'users', userId, 'days', key)
    setDoc(ref, {
      completed: existing?.completed || {},
      note: existing?.note || '',
      sessions: normalizeSessions(sessions),
    }, { merge: true }).catch(err => {
      console.error(err)
      setError(err)
    })
  }, [userId, configLoaded, daysLoaded, sessions, dayData])

  // Load all day data for this user (listen to changes)
  useEffect(() => {
    if (!userId) return
    setDaysLoaded(false)
    const col = collection(db, 'users', userId, 'days')
    const unsub = onSnapshot(
      col,
      snap => {
        const data = {}
        snap.forEach(d => { data[d.id] = d.data() })
        setDayData(data)
        setDaysLoaded(true)
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
