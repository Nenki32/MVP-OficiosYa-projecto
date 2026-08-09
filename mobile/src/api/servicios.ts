import { api } from './client'

export interface Servicio {
  id: number
  nombre: string
  descripcion: string | null
}

export const serviciosApi = {
  listar: () => api.get<Servicio[]>('/servicios'),
}

/**
 * Icono de Ionicons para cada rubro del catalogo.
 * El backend no envia iconos, asi que el mapeo vive aca; si aparece un rubro
 * nuevo cae en el generico y no rompe nada.
 */
const ICONOS: Record<string, string> = {
  gasista: 'flame-outline',
  electricista: 'flash-outline',
  plomero: 'water-outline',
  pintor: 'color-palette-outline',
  cerrajero: 'key-outline',
  carpintero: 'hammer-outline',
  albanil: 'cube-outline',
  techista: 'home-outline',
  jardinero: 'leaf-outline',
  'servicio tecnico': 'construct-outline',
}

export function iconoDeServicio(nombre: string): string {
  const clave = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca acentos: "Tecnico" -> "tecnico"
    .replace(/ñ/g, 'n')
  return ICONOS[clave] ?? 'build-outline'
}
