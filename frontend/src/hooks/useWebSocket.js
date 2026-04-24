import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket(path, { onMessage, enabled = true } = {}) {
  const ws       = useRef(null)
  const [status, setStatus] = useState('disconnected')  // connected | disconnected | error
  const [lastMsg, setLastMsg] = useState(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    if (!enabled) return
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${path}`
    try {
      const socket = new WebSocket(url)
      ws.current = socket

      socket.onopen  = () => setStatus('connected')
      socket.onclose = () => {
        setStatus('disconnected')
        reconnectTimer.current = setTimeout(connect, 3000)
      }
      socket.onerror = () => setStatus('error')
      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastMsg(data)
          onMessage?.(data)
        } catch {}
      }
    } catch {
      setStatus('error')
    }
  }, [path, enabled, onMessage])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return { status, lastMsg }
}
