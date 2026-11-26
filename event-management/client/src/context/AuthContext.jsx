import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest, verifyLoginOtp as verifyLoginOtpRequest } from '../services/authService'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      if (!token) {
        if (mounted) setLoading(false)
        return
      }

      try {
        const response = await getMe()
        if (mounted) setUser(response.data.data)
      } catch {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        if (mounted) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    restoreSession()
    return () => { mounted = false }
  }, [token])

  async function login(credentials) {
    const { rememberMe = false, ...loginDetails } = credentials
    const response = await loginRequest(loginDetails)
    const nextToken = response.data.data.token
    const nextUser = response.data.data.user
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    ;(rememberMe ? localStorage : sessionStorage).setItem('token', nextToken)
    setToken(nextToken)
    setUser(nextUser)
    return nextUser
  }

  async function loginWithOtp(credentials, rememberMe = false) {
    const response = await verifyLoginOtpRequest(credentials)
    const nextToken = response.data.data.token
    const nextUser = response.data.data.user
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    ;(rememberMe ? localStorage : sessionStorage).setItem('token', nextToken)
    setToken(nextToken)
    setUser(nextUser)
    return nextUser
  }

  async function register(details) {
    const response = await registerRequest(details)
    const nextToken = response.data.data.token
    const nextUser = response.data.data.user
    if (nextToken) {
      localStorage.setItem('token', nextToken)
      setToken(nextToken)
      setUser(nextUser)
    }
    return nextUser
  }

  async function logout() {
    try { await logoutRequest() } catch { /* local logout still completes */ }
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, loading, login, loginWithOtp, register, logout, setUser }}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export { AuthProvider, useAuth }
