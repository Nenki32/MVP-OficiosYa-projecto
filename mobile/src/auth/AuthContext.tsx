import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStorage, setOnSesionInvalida } from '../api/client'

export type Rol = 'cliente' | 'profesional' | 'admin'

export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: Rol
  nivelProfesional: string | null
  estado: number
  token: string
}

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  // Restaura la sesion guardada al abrir la app.
  useEffect(() => {
    let vivo = true

    setOnSesionInvalida(() => { if (vivo) setUsuario(null) })

    ;(async () => {
      try {
        const guardado = await tokenStorage.getUsuario<Usuario>()
        if (vivo && guardado) setUsuario(guardado)
      } finally {
        if (vivo) setCargando(false)
      }
    })()

    return () => { vivo = false }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<Usuario>('/auth/login', { email, password })
    await tokenStorage.set(res.token)
    await tokenStorage.setUsuario(res)
    setUsuario(res)
  }

  const logout = async () => {
    // Con JWT stateless el logout es del lado del cliente: se descarta el token.
    await tokenStorage.clear()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

