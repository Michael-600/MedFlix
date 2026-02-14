import { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = storage.get('user')
    if (saved) setUser(saved)
    setLoading(false)
  }, [])

  const login = (userData) => {
    const user = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    }
    setUser(user)
    storage.set('user', user)
    return user
  }

  const logout = () => {
    setUser(null)
    storage.remove('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
