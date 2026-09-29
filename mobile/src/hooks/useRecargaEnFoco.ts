import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'

/** Cada cuanto se vuelve a pedir mientras la pantalla esta a la vista. */
const INTERVALO_MS = 15_000

/**
 * Carga al entrar a la pantalla y vuelve a cargar cada 15 s mientras siga
 * visible. Al salir se corta, asi no se consulta de fondo.
 *
 * Es el "tiempo real" barato: sin websockets, alcanza para ver llegar
 * presupuestos o cambios de estado sin tocar nada.
 */
export function useRecargaEnFoco(cargar: () => void, sondear = true) {
  useFocusEffect(useCallback(() => {
    cargar()
    if (!sondear) return
    const intervalo = setInterval(cargar, INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [cargar, sondear]))
}
