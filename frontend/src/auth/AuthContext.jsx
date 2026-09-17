import { useState } from 'react'
import { loginUser } from '../api/client'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ user: null, token: null })

  async function login(credentials) {
    const result = await loginUser(credentials)
    setAuth({ user: result.user, token: result.token })
    return result
  }

  function logout() {
    setAuth({ user: null, token: null })
  }

  // TODO: Persist auth between refreshes once the MVP auth flow is settled.
  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
