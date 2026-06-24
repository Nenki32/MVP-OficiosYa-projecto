import { api } from '../infrastructure/api/client'

export interface AuthUser {
  id: number
  email: string
  nombre: string
  rol: string
  nivelProfesional: string | null
  estado: number
  token: string
}

export interface RegisterClienteData {
  email: string
  password: string
  nombre: string
  telefono?: string
  dni?: string
}

export interface RegisterProfesionalData {
  email: string
  password: string
  nombre: string
  telefono?: string
  dni?: string
  nivelProfesional: string
  numeroMatricula?: string
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthUser>('/auth/login', { email, password }),

  registerCliente: (data: RegisterClienteData) =>
    api.post<AuthUser>('/auth/register/cliente', data),

  registerProfesional: (data: RegisterProfesionalData) =>
    api.post<AuthUser>('/auth/register/profesional', data),

  logout: () =>
    api.post('/auth/logout').catch(() => {}),
}
