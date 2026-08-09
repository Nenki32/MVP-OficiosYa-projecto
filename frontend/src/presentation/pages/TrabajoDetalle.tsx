import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../infrastructure/api/client'
import Navbar from '../components/Navbar'

interface Postulacion {
  id: number
  profesionalId: number
  profesionalNombre: string
  nivelProfesional: string | null
  presupuesto: number | null
}

interface TrabajoDetalle {
  id: number
  clienteId: number
  clienteNombre: string
  profesionalId: number | null
  profesionalNombre: string | null
  servicioNombre: string
  estado: string
  descripcion: string | null
  tipoPago: string
  direccionDestino: string | null
  creadoEn: string
  actualizadoEn: string
  postulaciones: Postulacion[]
}

export default function TrabajoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trabajo, setTrabajo] = useState<TrabajoDetalle | null>(null)
  const [monto, setMonto] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const cargar = () =>
    api.get<TrabajoDetalle>(`/trabajos/${id}`).then(setTrabajo)

  useEffect(() => { cargar() }, [id])

  const cambiarEstado = async (nuevoEstado: string) => {
    try {
      await api.patch(`/trabajos/${id}/estado`, { estado: nuevoEstado })
      cargar()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const postularse = async () => {
    setError(''); setAviso('')
    try {
      await api.post(`/trabajos/${id}/postularse`, {
        presupuesto: presupuesto ? parseFloat(presupuesto) : null
      })
      setPresupuesto('')
      setAviso('Te postulaste. El cliente va a ver tu propuesta.')
      cargar()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const asignar = async (profesionalId: number) => {
    try {
      await api.post(`/trabajos/${id}/asignar/${profesionalId}`, {})
      cargar()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const completar = async () => {
    if (!monto) return
    try {
      await api.post(`/trabajos/${id}/completar`, {
        montoTotal: parseFloat(monto),
        tipoPago: trabajo!.tipoPago
      })
      setMonto('')
      cargar()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!trabajo) return <div className="p-6 text-gray-500">Cargando...</div>

  const esCliente = user?.id === trabajo.clienteId
  const esProfesionalAsignado = user?.id === trabajo.profesionalId
  const miPostulacion = trabajo.postulaciones.find(p => p.profesionalId === user?.id)
  const yaPostulado = miPostulacion !== undefined

  const acciones: Record<string, string[]> = {
    pendiente: esProfesionalAsignado ? ['cancelado'] : esCliente ? ['cancelado'] : [],
    aceptado: esProfesionalAsignado ? ['viajando', 'cancelado'] : esCliente ? ['cancelado'] : [],
    viajando: ['en_progreso', 'cancelado'],
    en_progreso: esProfesionalAsignado ? ['completado'] : [],
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

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p><strong>Cliente:</strong> {trabajo.clienteNombre}</p>
            <p><strong>Profesional:</strong> {trabajo.profesionalNombre || 'Sin asignar'}</p>
            {trabajo.descripcion && <p><strong>Descripción:</strong> {trabajo.descripcion}</p>}
            {trabajo.direccionDestino && <p><strong>Dirección:</strong> {trabajo.direccionDestino}</p>}
            <p><strong>Pago:</strong> {trabajo.tipoPago}</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {aviso && <p className="text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm mb-4">{aviso}</p>}

          {user?.rol === 'profesional' && trabajo.estado === 'pendiente' && (
            yaPostulado ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-green-800">Ya te postulaste a este trabajo</p>
                <p className="text-xs text-green-700 mt-1">
                  {miPostulacion?.presupuesto
                    ? `Tu presupuesto: $${miPostulacion.presupuesto}`
                    : 'No indicaste presupuesto'}
                  {' · '}Esperando que el cliente decida.
                </p>
              </div>
            ) : (
              <div className="border rounded p-3 mb-4">
                <label className="block text-sm font-medium mb-2">Postularme a este trabajo</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0.01" placeholder="Presupuesto $ (opcional)"
                    value={presupuesto} onChange={e => setPresupuesto(e.target.value)}
                    className="border rounded px-3 py-2 flex-1 text-sm" />
                  <button onClick={postularse}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 cursor-pointer">
                    Postularme
                  </button>
                </div>
              </div>
            )
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {(acciones[trabajo.estado] || []).map(accion => (
              <button key={accion} onClick={() => cambiarEstado(accion)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 cursor-pointer">
                {accion === 'en_progreso' ? 'Empezar trabajo' :
                 accion === 'viajando' ? 'Viajar al lugar' :
                 accion.charAt(0).toUpperCase() + accion.slice(1)}
              </button>
            ))}
          </div>

          {esCliente && trabajo.estado === 'pendiente' && trabajo.postulaciones.length > 0 && (
            <div className="border-t pt-4 mb-4">
              <h3 className="font-medium mb-2">Profesionales interesados</h3>
              <div className="space-y-2">
                {trabajo.postulaciones.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded p-3">
                    <div>
                      <p className="font-medium">{p.profesionalNombre}</p>
                      <p className="text-xs text-gray-500">
                        {p.nivelProfesional === 'premium' ? 'Matriculado' : 'Standard'}
                        {p.presupuesto && ` - Presupuesto: $${p.presupuesto}`}
                      </p>
                    </div>
                    <button onClick={() => asignar(p.profesionalId)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer">
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trabajo.estado === 'en_progreso' && (
            <div className="border-t pt-4">
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
