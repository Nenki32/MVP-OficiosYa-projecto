import { api } from './client'

export interface ServicioDelProfesional {
  id: number
  nombre: string
}

export interface PerfilProfesional {
  id: number
  nombre: string
  email: string
  telefono: string | null

  tipoPerfil: 'persona' | 'empresa'
  razonSocial: string | null
  cuit: string | null

  nivelProfesional: string | null
  numeroMatricula: string | null
  descripcion: string | null

  latitud: number | null
  longitud: number | null
  radioCoberturaKm: number | null
  disponible: boolean

  servicios: ServicioDelProfesional[]
  /** Qué falta completar para recibir trabajos. Vacío = perfil completo. */
  faltantes: string[]
}

export interface ActualizarPerfil {
  nombre: string
  telefono?: string | null
  tipoPerfil: 'persona' | 'empresa'
  razonSocial?: string | null
  cuit?: string | null
  descripcion?: string | null
  radioCoberturaKm?: number | null
  disponible: boolean
}

export const profesionalesApi = {
  miPerfil: () => api.get<PerfilProfesional>('/profesionales/me/perfil'),

  actualizarPerfil: (datos: ActualizarPerfil) =>
    api.put<PerfilProfesional>('/profesionales/me/perfil', datos),

  actualizarUbicacion: (latitud: number, longitud: number) =>
    api.put<PerfilProfesional>('/profesionales/me/ubicacion', { latitud, longitud }),

  actualizarServicios: (servicioIds: number[]) =>
    api.put<PerfilProfesional>('/profesionales/me/servicios', { servicioIds }),
}
