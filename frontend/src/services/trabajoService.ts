import { api } from '../infrastructure/api/client'

export const trabajoService = {
  listar: () => api.get<any[]>('/trabajos'),

  obtener: (id: number) => api.get<any>(`/trabajos/${id}`),

  crear: (data: any) => api.post<any>('/trabajos', data),

  cambiarEstado: (id: number, estado: string) =>
    api.patch(`/trabajos/${id}/estado`, { estado }),

  completar: (id: number, data: any) =>
    api.post(`/trabajos/${id}/completar`, data),

  postularse: (id: number, presupuesto?: number | null) =>
    api.post(`/trabajos/${id}/postularse`, { presupuesto }),

  asignar: (id: number, profesionalId: number) =>
    api.post(`/trabajos/${id}/asignar/${profesionalId}`, {}),
}
