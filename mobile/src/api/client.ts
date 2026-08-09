import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

/**
 * Base de la API. Viene de app.json > expo.extra.apiUrl.
 *
 * OJO: desde el celular, "localhost" es el propio telefono, no la PC.
 * Hay que usar la IP de la PC en la red local (ej. http://192.168.1.4:5100/api)
 * y el backend tiene que escuchar en 0.0.0.0, no solo en localhost.
 */
const API_BASE = (Constants.expoConfig?.extra?.apiUrl as string) ?? ''

const TOKEN_KEY = 'encoya.token'
const USUARIO_KEY = 'encoya.usuario'

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t),

  getUsuario: async <T,>(): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(USUARIO_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },
  setUsuario: (u: unknown) =>
    SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(u)),

  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(USUARIO_KEY)
  },
}

/** Se dispara cuando el servidor rechaza la sesion guardada. */
let onSesionInvalida: (() => void) | null = null
export const setOnSesionInvalida = (fn: () => void) => { onSesionInvalida = fn }

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const dormir = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * El plan gratuito de Render apaga el servicio tras unos minutos sin uso.
 * Mientras despierta, su borde responde 404 con texto plano en vez de poner
 * la peticion en espera. Nuestra API siempre responde JSON, asi que un 404
 * que no es JSON significa "todavia no hay servidor", no "no existe".
 */
function esDespertando(res: Response) {
  const tipo = res.headers.get('content-type') ?? ''
  return res.status === 404 && !tipo.includes('json')
}

const REINTENTOS = 5
const ESPERA_MS = 4000

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.get()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response | null = null

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    } catch {
      // fetch solo falla asi cuando no hubo respuesta: sin red, URL mal, o
      // el servidor todavia no acepta conexiones.
      if (intento < REINTENTOS) { await dormir(ESPERA_MS); continue }
      throw new ApiError('No se pudo conectar con el servidor.', 0)
    }

    if (!esDespertando(res)) break
    if (intento < REINTENTOS) await dormir(ESPERA_MS)
  }

  if (!res || esDespertando(res)) {
    throw new ApiError(
      'El servidor está tardando en responder. Probá de nuevo en un minuto.',
      503,
    )
  }

  if (!res.ok) {
    // 401 con token = la sesion guardada ya no vale. Sin token es un login
    // fallido, y ese 401 es una respuesta legitima.
    if (res.status === 401 && token) {
      await tokenStorage.clear()
      onSesionInvalida?.()
      throw new ApiError('Tu sesion expiro. Volve a iniciar sesion.', 401)
    }

    const body = await res.json().catch(() => ({} as any))
    throw new ApiError(body?.error ?? `Error ${res.status}`, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
}
