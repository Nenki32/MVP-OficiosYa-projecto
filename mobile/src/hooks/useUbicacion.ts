import { useState } from 'react'
import * as Location from 'expo-location'

export type EstadoPermiso = 'sin-pedir' | 'concedido' | 'denegado'

export interface Coordenadas {
  latitud: number
  longitud: number
}

/**
 * Obtiene la ubicacion del dispositivo, pidiendo permiso la primera vez.
 *
 * El permiso es del sistema operativo, no algo que podamos forzar: si el
 * usuario lo niega, la busqueda por cercania no puede funcionar. La app tiene
 * que decirlo con claridad en vez de fallar en silencio.
 */
export function useUbicacion() {
  const [permiso, setPermiso] = useState<EstadoPermiso>('sin-pedir')
  const [obteniendo, setObteniendo] = useState(false)
  const [error, setError] = useState('')

  const obtener = async (): Promise<Coordenadas | null> => {
    setError('')
    setObteniendo(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setPermiso('denegado')
        setError(
          'Sin permiso de ubicación no podemos mostrarte los trabajos cercanos. ' +
          'Podés activarlo desde los ajustes del teléfono.',
        )
        return null
      }

      setPermiso('concedido')

      // Balanced alcanza: se necesita el barrio, no el metro exacto, y es
      // bastante mas rapido y menos costoso en bateria que High.
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      return {
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      }
    } catch {
      setError('No pudimos obtener tu ubicación. Verificá que el GPS esté encendido.')
      return null
    } finally {
      setObteniendo(false)
    }
  }

  return { obtener, permiso, obteniendo, error }
}
