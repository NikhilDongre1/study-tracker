import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { DEFAULT_SESSIONS } from '../lib/defaults'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function useFirestore(userId) {
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS)
  const [dayData, setDayData] = useState({})   // { [dateKey]: { completed: {}, note: '' } }
  const [loading, setLoading] = useState(true)

  // Load session config (user's custom sessions)
  useEffect(() => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'config', 'sessions')
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setSessions(snap.data().list)
      else setSessions(DEFAULT_SESSIONS)
      setLoading(false)
    })
    return unsub
  }, [userId])

  // Load all day data for this user (listen to changes)
  useEffect(() => {
    if (!userId) return
    const col = collection(db, 'users', userId, 'days')
    const unsub = onSnapshot(col, snap => {
      const data = {}
      snap.forEach(d => { data[d.id] = d.data() })
      setDayData(data)
    })
    return unsub
  }, [userId])

  const saveSessions = useCallback(async (newSessions) => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'config', 'sessions')
    await setDoc(ref, { list: newSessions })
  }, [userId])

  const toggleSession = useCallback(async (dateKey, sessionId) => {
    if (!userId) return
    const existing = dayData[dateKey] || { completed: {}, note: '' }
    const newCompleted = {
      ...existing.completed,
      [sessionId]: !existing.completed?.[sessionId]
    }
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { ...existing, completed: newCompleted }, { merge: true })
  }, [userId, dayData])

  const saveNote = useCallback(async (dateKey, note) => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { note }, { merge: true })
  }, [userId])

  const resetDay = useCallback(async (dateKey) => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'days', dateKey)
    await setDoc(ref, { completed: {}, note: '' })
  }, [userId])

  return { sessions, dayData, loading, saveSessions, toggleSession, saveNote, resetDay }
}
