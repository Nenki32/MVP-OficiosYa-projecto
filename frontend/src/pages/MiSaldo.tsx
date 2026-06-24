import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Navbar from '../components/Navbar'

interface Movimiento {
  id: number
  tipo: string
  monto: number
  saldoPosterior: number
  referencia: string | null
  creadoEn: string
}

export default function MiSaldo() {
  const [saldo, setSaldo] = useState(0)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [montoPago, setMontoPago] = useState('')
  const [error, setError] = useState('')

  const cargar = () => {
    api.get<{ saldoActual: number }>('/cuenta-corriente/saldo').then(r => setSaldo(r.saldoActual))
    api.get<Movimiento[]>('/cuenta-corriente/movimientos').then(setMovimientos)
  }

  useEffect(() => { cargar() }, [])

  const pagar = async () => {
    if (!montoPago) return
    try {
      await api.post('/cuenta-corriente/pagar', { monto: parseFloat(montoPago) })
      setMontoPago('')
      setError('')
      cargar()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const tipoTexto: Record<string, string> = {
    comision_adeudada: 'Comisión 15%',
    pago_deuda: 'Pago de deuda',
    ajuste_manual: 'Ajuste manual'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-6">Mi cuenta corriente</h2>

        <div className="bg-white rounded shadow p-6 mb-6">
          <p className="text-sm text-gray-500">Saldo actual</p>
          <p className={`text-3xl font-bold ${saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${saldo.toFixed(2)}
          </p>

          {saldo < 0 && (
            <div className="mt-4 flex gap-2">
              <input type="number" step="0.01" placeholder="Monto a pagar"
                value={montoPago} onChange={e => setMontoPago(e.target.value)}
                className="border rounded px-3 py-2 flex-1" />
              <button onClick={pagar} disabled={!montoPago}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                Pagar
              </button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <h3 className="font-semibold mb-3">Movimientos</h3>
        <div className="space-y-2">
          {movimientos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sin movimientos</p>
          ) : (
            movimientos.map(m => (
              <div key={m.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{tipoTexto[m.tipo] || m.tipo}</p>
                  {m.referencia && <p className="text-xs text-gray-400">{m.referencia}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-medium ${m.monto < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {m.monto > 0 ? '+' : ''}${m.monto.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Saldo: ${m.saldoPosterior.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
