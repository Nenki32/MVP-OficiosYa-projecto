import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CrearTrabajo from './pages/CrearTrabajo'
import TrabajoDetalle from './pages/TrabajoDetalle'
import AdminDashboard from './pages/AdminDashboard'
import MiSaldo from './pages/MiSaldo'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/crear-trabajo" element={<ProtectedRoute roles={['cliente']}><CrearTrabajo /></ProtectedRoute>} />
      <Route path="/trabajos/:id" element={<ProtectedRoute><TrabajoDetalle /></ProtectedRoute>} />
      <Route path="/mi-saldo" element={<ProtectedRoute roles={['profesional']}><MiSaldo /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}
