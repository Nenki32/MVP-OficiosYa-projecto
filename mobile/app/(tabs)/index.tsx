import { useAuth } from '../../src/auth/AuthContext'
import { HomeCliente } from '../../src/screens/HomeCliente'
import { HomeProfesional } from '../../src/screens/HomeProfesional'

/**
 * Cliente y profesional ven cosas distintas en el inicio: el cliente pide un
 * servicio, el profesional busca trabajo. Comparten el esqueleto visual, no el
 * contenido.
 */
export default function Home() {
  const { usuario } = useAuth()
  return usuario?.rol === 'profesional' ? <HomeProfesional /> : <HomeCliente />
}
