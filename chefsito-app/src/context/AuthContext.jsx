import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const { user: profile } = await api('/auth/me')
      setUser(profile)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // ignorar si el token ya expiró
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return ctx
}
