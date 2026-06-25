import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService, type AuthUser, type RegisterClienteData, type RegisterProfesionalData } from '../services/authService'

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  registerCliente: (data: RegisterClienteData) => Promise<void>
  registerProfesional: (data: RegisterProfesionalData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user?.token) localStorage.setItem('token', user.token)
  }, [user])

  const setAuth = (res: AuthUser) => {
    setUser(res)
    localStorage.setItem('user', JSON.stringify(res))
    localStorage.setItem('token', res.token)
  }

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password)
    setAuth(res)
  }

  const registerCliente = async (data: RegisterClienteData) => {
    const res = await authService.registerCliente(data)
    setAuth(res)
  }

  const registerProfesional = async (data: RegisterProfesionalData) => {
    const res = await authService.registerProfesional(data)
    setAuth(res)
  }

  const logout = async () => {
    await authService.logout()
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
