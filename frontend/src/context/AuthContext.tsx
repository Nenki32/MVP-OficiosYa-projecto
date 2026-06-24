import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: number
  email: string
  nombre: string
  rol: string
  nivelProfesional: string | null
  estado: number
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  registerCliente: (data: RegisterClienteData) => Promise<void>
  registerProfesional: (data: RegisterProfesionalData) => Promise<void>
  logout: () => Promise<void>
}

interface RegisterClienteData {
  email: string
  password: string
  nombre: string
  telefono?: string
  dni?: string
}

interface RegisterProfesionalData {
  email: string
  password: string
  nombre: string
  telefono?: string
  dni?: string
  nivelProfesional: string
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

  const setAuth = (res: User) => {
    setUser(res)
    localStorage.setItem('user', JSON.stringify(res))
    localStorage.setItem('token', res.token)
  }

  const login = async (email: string, password: string) => {
    const res = await api.post<User>('/auth/login', { email, password })
    setAuth(res)
  }

  const registerCliente = async (data: RegisterClienteData) => {
    const res = await api.post<User>('/auth/register/cliente', data)
    setAuth(res)
  }

  const registerProfesional = async (data: RegisterProfesionalData) => {
    const res = await api.post<User>('/auth/register/profesional', data)
    setAuth(res)
  }

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, registerCliente, registerProfesional, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
