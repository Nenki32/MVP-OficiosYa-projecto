import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: number
  email: string
  nombre: string
  rol: string
  nivelProfesional: string | null
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  nombre: string
  telefono?: string
  rol: string
  nivelProfesional?: string
  dni?: string
  numeroMatricula?: string
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user?.token) localStorage.setItem('token', user.token)
  }, [user])

  const login = async (email: string, password: string) => {
    const res = await api.post<User>('/auth/login', { email, password })
    setUser(res)
    localStorage.setItem('user', JSON.stringify(res))
    localStorage.setItem('token', res.token)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post<User>('/auth/register', data)
    setUser(res)
    localStorage.setItem('user', JSON.stringify(res))
    localStorage.setItem('token', res.token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
