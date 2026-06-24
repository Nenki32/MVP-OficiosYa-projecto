import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      await login(email, password)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Ingresar</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 cursor-pointer">
          Entrar
        </button>

        <p className="text-sm text-center mt-4">
          ¿No tenés cuenta? <Link to="/register" className="text-blue-600">Registrate</Link>
        </p>
      </form>
    </div>
  )
}
