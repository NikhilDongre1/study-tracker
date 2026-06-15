import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    setMsg(text)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 2200)
  }, [])

  return { msg, visible, showToast }
}

export function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      color: 'var(--text)', padding: '10px 20px',
      borderRadius: 10, fontSize: 13,
      transition: 'transform 0.3s ease', zIndex: 999,
      whiteSpace: 'nowrap', pointerEvents: 'none',
    }}>{msg}</div>
  )
}
