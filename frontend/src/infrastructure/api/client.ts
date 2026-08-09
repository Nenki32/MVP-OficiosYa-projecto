const API_BASE = '/api'

/** Se dispara cuando el servidor rechaza la sesion guardada. */
function sesionInvalida() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Recarga completa para descartar cualquier estado en memoria.
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    // 401 con token enviado = la sesion guardada ya no vale (expirada, usuario
    // borrado, clave JWT rotada). Sin token es un login fallido: ese 401 es
    // una respuesta legitima y lo dejamos pasar como error normal.
    if (res.status === 401 && token) {
      sesionInvalida()
      throw new Error('Tu sesion expiro. Volve a iniciar sesion.')
    }

    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }

  // 204 y respuestas sin cuerpo no se pueden parsear como JSON.
  if (res.status === 204) return undefined as T

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
}
