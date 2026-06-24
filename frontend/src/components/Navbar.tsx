import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-blue-600">EncoYa</Link>

        <div className="flex items-center gap-4 text-sm">
          {user?.rol === 'profesional' && (
            <Link to="/mi-saldo" className="text-gray-600 hover:text-blue-600">Mi saldo</Link>
          )}
          {user?.rol === 'admin' && (
            <Link to="/admin" className="text-gray-600 hover:text-blue-600">Admin</Link>
          )}

          <span className="text-gray-400">{user?.nombre}</span>
          <button onClick={() => logout().catch(() => {})}
            className="text-red-500 hover:text-red-700 cursor-pointer">
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
