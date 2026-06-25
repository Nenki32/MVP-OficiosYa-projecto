import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'

export default function Register() {
  const { registerCliente, registerProfesional } = useAuth()
  const [form, setForm] = useState({
    email: '', password: '', nombre: '', telefono: '',
    rol: 'cliente', nivelProfesional: 'standard', dni: '', numeroMatricula: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (form.rol === 'cliente') {
        await registerCliente({
          email: form.email, password: form.password, nombre: form.nombre,
          telefono: form.telefono || undefined, dni: form.dni || undefined
        })
      } else {
        await registerProfesional({
          email: form.email, password: form.password, nombre: form.nombre,
          telefono: form.telefono || undefined, dni: form.dni || undefined,
          nivelProfesional: form.nivelProfesional,
          numeroMatricula: form.nivelProfesional === 'premium' ? form.numeroMatricula : undefined
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3" required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3" required />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3" />
        <input name="password" type="password" placeholder="Contraseña" value={form.password}
          onChange={handleChange} className="w-full border rounded px-3 py-2 mb-3" required />

        <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3" />

        <select name="rol" value={form.rol} onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-3 bg-white">
          <option value="cliente">Cliente</option>
          <option value="profesional">Profesional</option>
        </select>

        {form.rol === 'profesional' && (
          <>
            <select name="nivelProfesional" value={form.nivelProfesional} onChange={handleChange}
              className="w-full border rounded px-3 py-2 mb-3 bg-white">
              <option value="standard">Standard (sin matrícula)</option>
              <option value="premium">Premium (matriculado)</option>
            </select>
            {form.nivelProfesional === 'premium' && (
              <input name="numeroMatricula" placeholder="Número de matrícula"
                value={form.numeroMatricula} onChange={handleChange}
                className="w-full border rounded px-3 py-2 mb-3" required />
            )}
          </>
        )}

        <button className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 cursor-pointer">
          Registrarse
        </button>

        <p className="text-sm text-center mt-4">
          ¿Ya tenés cuenta? <Link to="/login" className="text-blue-600">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
