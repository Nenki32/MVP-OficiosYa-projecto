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

/**
 * Convierte coordenadas en un texto legible ("Belgrano, CABA").
 *
 * Al usuario no le sirve ver "-34.550922, -58.448295": no le dice nada y
 * ademas expone su posicion exacta en pantalla. Se usa el geocodificador del
 * sistema operativo, que no necesita claves ni servicios externos.
 *
 * Puede fallar o devolver poco segun el dispositivo y la zona, asi que
 * siempre hay que contemplar el caso de que devuelva null.
 */
export async function describirUbicacion(
  latitud: number,
  longitud: number,
): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({ latitude: latitud, longitude: longitud })
    if (!lugar) return null

    // Se arma de lo mas especifico a lo mas general, con lo que haya.
    const partes = [
      lugar.district ?? lugar.subregion,
      lugar.city ?? lugar.region,
    ].filter((x): x is string => !!x && x.trim().length > 0)

    return partes.length > 0 ? [...new Set(partes)].join(', ') : null
  } catch {
    return null
  }
}

/**
 * Convierte coordenadas en una direccion para precargar el formulario
 * ("Av. Cabildo 1234, Rosario, Santa Fe"). Es solo una sugerencia: el usuario la
 * puede corregir a mano. Devuelve null si el sistema no encuentra la calle.
 */
export async function direccionDeUbicacion(
  latitud: number,
  longitud: number,
): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({ latitude: latitud, longitude: longitud })
    if (!lugar) return null

    const calle = lugar.street
      ? [lugar.street, lugar.streetNumber].filter(Boolean).join(' ')
      : lugar.name
    if (!calle) return null

    // Formato: Calle numero, Localidad, Provincia. Si la localidad y la
    // provincia se llaman igual (ej. CABA), va una sola vez.
    const localidad = lugar.city ?? lugar.district ?? lugar.subregion
    const provincia = lugar.region
    return [...new Set([calle, localidad, provincia].filter((x): x is string => !!x))].join(', ')
  } catch {
    return null
  }
}
