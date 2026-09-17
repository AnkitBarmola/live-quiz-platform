import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../api/client'
import { SocketContext } from './context'

const SOCKET_URL = new URL(API_BASE_URL).origin

function isLiveRoute(pathname) {
  return /^\/play\/[^/]+$/.test(pathname) || /^\/host\/quiz\/[^/]+\/live$/.test(pathname)
}

export function SocketProvider({ children }) {
  const location = useLocation()
  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const [connectionState, setConnectionState] = useState('connecting')
  const [error, setError] = useState('')

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setSocket(null)
    setConnectionState('connecting')
  }, [])

  const connect = useCallback((auth) => {
    disconnect()
    setError('')
    setConnectionState('connecting')
    console.log(`[Socket] Connecting to ${SOCKET_URL}`)
    const nextSocket = io(SOCKET_URL, { auth })
    socketRef.current = nextSocket
    setSocket(nextSocket)

    nextSocket.on('connect', () => {
      console.log(`[Socket] Connected to ${SOCKET_URL}`)
      setConnectionState('connected')
      setError('')
    })
    nextSocket.on('connect_error', (connectError) => {
      console.error('[Socket] Connection failed:', connectError)
      setConnectionState('error')
      setError(connectError.message || 'Unable to connect to the live quiz.')
    })
    nextSocket.on('auth-error', (authError) => {
      setConnectionState('error')
      setError(authError.message || 'Socket authentication failed.')
    })
    nextSocket.on('disconnect', () => {
      console.warn('[Socket] Disconnected from the backend')
      setConnectionState('error')
    })

    return nextSocket
  }, [disconnect])

  const connectAsHost = useCallback((token, quizId) => {
    return connect({ token, quizId })
  }, [connect])

  const connectAsPlayer = useCallback((participantId, quizId) => {
    return connect({ participantId, quizId })
  }, [connect])

  useEffect(() => {
    if (!isLiveRoute(location.pathname)) {
      const timeoutId = window.setTimeout(disconnect)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [disconnect, location.pathname])

  useEffect(() => () => disconnect(), [disconnect])

  const dismissError = useCallback(() => {
    setError('')
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket,
        connectionState,
        error,
        dismissError,
        connectAsHost,
        connectAsPlayer,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
