import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Navbar from '../components/Navbar'

interface DashboardData {
  totalClientes: number
  totalProfesionales: number
  totalTrabajos: number
  trabajosPendientes: number
  trabajosCompletados: number
  comisionesPendientes: number
}

interface Usuario {
  id: number
  email: string
  nombre: string
  rol: string
  nivelProfesional: string | null
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard').then(setData)
    api.get<Usuario[]>('/admin/usuarios').then(setUsuarios)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-6">Panel Admin</h2>

        {data && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold">{data.totalClientes}</p>
              <p className="text-sm text-gray-500">Clientes</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold">{data.totalProfesionales}</p>
              <p className="text-sm text-gray-500">Profesionales</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold">{data.totalTrabajos}</p>
              <p className="text-sm text-gray-500">Trabajos totales</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.trabajosPendientes}</p>
              <p className="text-sm text-gray-500">Pendientes</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{data.trabajosCompletados}</p>
              <p className="text-sm text-gray-500">Completados</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-red-600">${data.comisionesPendientes.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Comisiones pendientes</p>
            </div>
          </div>
        )}

        <h3 className="font-semibold mb-3">Usuarios registrados</h3>
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.nombre}</td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3">{u.rol}</td>
                  <td className="p-3">{u.nivelProfesional || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
