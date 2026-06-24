import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

interface Trabajo {
  id: number
  clienteNombre: string
  profesionalNombre: string | null
  servicioNombre: string
  estado: string
  tipoPago: string
  direccionDestino: string | null
  creadoEn: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])

  useEffect(() => {
    api.get<Trabajo[]>('/trabajos').then(setTrabajos)
  }, [])

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aceptado: 'bg-blue-100 text-blue-800',
    viajando: 'bg-purple-100 text-purple-800',
    en_progreso: 'bg-orange-100 text-orange-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {user?.rol === 'cliente' ? 'Mis solicitudes' : 'Trabajos disponibles'}
          </h2>
          {user?.rol === 'cliente' && (
            <Link to="/crear-trabajo"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Nuevo trabajo
            </Link>
          )}
        </div>

        {trabajos.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay trabajos aún</p>
        ) : (
          <div className="space-y-3">
            {trabajos.map(t => (
              <Link key={t.id} to={`/trabajos/${t.id}`}
                className="block bg-white rounded shadow p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{t.servicioNombre}</h3>
                    <p className="text-sm text-gray-500">
                      {user?.rol === 'cliente' ? t.profesionalNombre || 'Sin profesional' : t.clienteNombre}
                    </p>
                    {t.direccionDestino && (
                      <p className="text-sm text-gray-400">{t.direccionDestino}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${estadoColor[t.estado] || ''}`}>
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
