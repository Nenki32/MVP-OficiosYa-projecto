import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import Navbar from '../components/Navbar'

interface TrabajoDetalle {
  id: number
  clienteNombre: string
  profesionalNombre: string | null
  servicioNombre: string
  estado: string
  descripcion: string | null
  tipoPago: string
  direccionDestino: string | null
  latitudDestino: number | null
  longitudDestino: number | null
  creadoEn: string
  actualizadoEn: string
}

export default function TrabajoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trabajo, setTrabajo] = useState<TrabajoDetalle | null>(null)
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<TrabajoDetalle>(`/trabajos/${id}`).then(setTrabajo)
  }, [id])

  const cambiarEstado = async (nuevoEstado: string) => {
    try {
      const updated = await api.patch<TrabajoDetalle>(`/trabajos/${id}/estado`, { estado: nuevoEstado })
      setTrabajo(updated)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const completar = async () => {
    if (!monto) return
    try {
      const updated = await api.post<TrabajoDetalle>(`/trabajos/${id}/completar`, {
        montoTotal: parseFloat(monto),
        tipoPago: trabajo!.tipoPago
      })
      setTrabajo(updated)
      setMonto('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!trabajo) return <div className="p-6 text-gray-500">Cargando...</div>

  const acciones: Record<string, string[]> = {
    pendiente: user?.rol === 'profesional' ? ['aceptado'] : ['cancelado'],
    aceptado: user?.rol === 'profesional' ? ['viajando', 'cancelado'] : ['cancelado'],
    viajando: ['en_progreso', 'cancelado'],
    en_progreso: user?.rol === 'profesional' ? ['completado'] : [],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 mb-4 block">&larr; Volver</button>

        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{trabajo.servicioNombre}</h2>
            <span className="text-sm bg-gray-100 rounded px-2 py-1">{trabajo.estado.replace('_', ' ')}</span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p><strong>Cliente:</strong> {trabajo.clienteNombre}</p>
            <p><strong>Profesional:</strong> {trabajo.profesionalNombre || 'Sin asignar'}</p>
            {trabajo.descripcion && <p><strong>Descripción:</strong> {trabajo.descripcion}</p>}
            {trabajo.direccionDestino && <p><strong>Dirección:</strong> {trabajo.direccionDestino}</p>}
            <p><strong>Pago:</strong> {trabajo.tipoPago}</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {(acciones[trabajo.estado] || []).map(accion => (
              <button key={accion} onClick={() => cambiarEstado(accion)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 cursor-pointer">
                {accion === 'en_progreso' ? 'Empezar trabajo' :
                 accion === 'viajando' ? 'Viajando al lugar' :
                 accion === 'completado' ? 'Marcar completado' :
                 accion.charAt(0).toUpperCase() + accion.slice(1)}
              </button>
            ))}
          </div>

          {trabajo.estado === 'en_progreso' && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium mb-2">Completar trabajo</h3>
              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Monto total $"
                  value={monto} onChange={e => setMonto(e.target.value)}
                  className="border rounded px-3 py-2 flex-1" />
                <button onClick={completar} disabled={!monto}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                  Completar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
