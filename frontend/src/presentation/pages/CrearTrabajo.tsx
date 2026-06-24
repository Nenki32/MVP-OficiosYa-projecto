import { useEffect, useState } from 'react'
import { api } from '../../infrastructure/api/client'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

interface Servicio {
  id: number
  nombre: string
}

export default function SolicitarProfesional() {
  const navigate = useNavigate()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [form, setForm] = useState({
    servicioId: '', descripcion: '', tipoPago: 'efectivo',
    direccionDestino: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Servicio[]>('/servicios')
      .then(setServicios)
      .catch(err => setError(err.message))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res: any = await api.post('/trabajos', {
        servicioId: Number(form.servicioId),
        descripcion: form.descripcion || undefined,
        tipoPago: form.tipoPago,
        direccionDestino: form.direccionDestino || undefined,
      })
      navigate(`/trabajos/${res.id}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto p-6">
        <h2 className="text-xl font-semibold mb-6">Solicitar profesional</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
          <select value={form.servicioId} onChange={e => setForm(f => ({ ...f, servicioId: e.target.value }))}
            className="w-full border rounded px-3 py-2 bg-white" required>
            <option value="">Seleccioná un servicio</option>
            {servicios.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <textarea placeholder="Describí el problema" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full border rounded px-3 py-2" rows={3} />

          <input placeholder="Dirección donde se necesita el servicio" value={form.direccionDestino}
            onChange={e => setForm(f => ({ ...f, direccionDestino: e.target.value }))}
            className="w-full border rounded px-3 py-2" />

          <select value={form.tipoPago} onChange={e => setForm(f => ({ ...f, tipoPago: e.target.value }))}
            className="w-full border rounded px-3 py-2 bg-white">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>

          <button className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 cursor-pointer">
            Publicar solicitud
          </button>
        </form>
      </main>
    </div>
  )
}
