import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { iconoDeServicio } from '../api/servicios'
import { colors, formatEstado, radius, spacing, typography } from '../theme'

export interface Trabajo {
  id: number
  clienteNombre: string
  profesionalNombre: string | null
  servicioNombre: string
  estado: string
  tipoPago: string
  direccionDestino: string | null
  /** Día y hora propuestos para la visita. Null si no se agendó. */
  fechaVisita: string | null
  /** Km hasta el profesional. Null si alguno de los dos no tiene ubicación. */
  distanciaKm: number | null
  creadoEn: string
}

/** "0.8 km" para distancias cortas, "1,6 km" para el resto. */
const formatDistancia = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toString().replace('.', ',')} km`

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

/**
 * Fila de un trabajo. El icono sale del rubro y el color del chip, del estado.
 * Componente sin estado: solo recibe datos y dibuja.
 */
export function TrabajoCard({
  trabajo,
  verContraparte,
  mostrarDistancia = false,
}: {
  trabajo: Trabajo
  /** A quien mostrar debajo del rubro: el cliente o el profesional. */
  verContraparte: 'cliente' | 'profesional'
  /** Solo el profesional ve distancias: al cliente no le aportan nada. */
  mostrarDistancia?: boolean
}) {
  const colorEstado = colors.estado[trabajo.estado] ?? colors.textMuted

  const contraparte = verContraparte === 'cliente'
    ? trabajo.clienteNombre
    : (trabajo.profesionalNombre ?? 'Sin asignar')

  return (
    <View style={s.card}>
      <View style={s.icono}>
        <Ionicons
          name={iconoDeServicio(trabajo.servicioNombre) as any}
          size={22}
          color={colors.primaryDark}
        />
      </View>

      <View style={s.centro}>
        <Text style={typography.bodyStrong} numberOfLines={1}>
          {trabajo.servicioNombre}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>{contraparte}</Text>
        {trabajo.direccionDestino && (
          <Text style={typography.caption} numberOfLines={1}>
            {trabajo.direccionDestino}
          </Text>
        )}

        {mostrarDistancia && (
          trabajo.distanciaKm != null ? (
            <View style={s.distancia}>
              <Ionicons name="navigate-outline" size={12} color={colors.primaryDark} />
              <Text style={s.distanciaTexto}>a {formatDistancia(trabajo.distanciaKm)}</Text>
            </View>
          ) : (
            <View style={[s.distancia, s.sinUbicacion]}>
              <Ionicons name="help-circle-outline" size={12} color={colors.textMuted} />
              <Text style={[s.distanciaTexto, s.sinUbicacionTexto]}>
                Ubicación no especificada
              </Text>
            </View>
          )
        )}
      </View>

      <View style={s.derecha}>
        <View style={[s.chip, { backgroundColor: colorEstado + '22' }]}>
          <Text style={[s.chipTexto, { color: colorEstado }]}>
            {formatEstado(trabajo.estado)}
          </Text>
        </View>
        <Text style={s.fecha}>{formatFecha(trabajo.creadoEn)}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  icono: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  centro: { flex: 1, gap: 1 },
  derecha: { alignItems: 'flex-end', gap: spacing.xs },
  distancia: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-start', marginTop: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  distanciaTexto: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  sinUbicacion: { backgroundColor: colors.surfaceAlt },
  sinUbicacionTexto: { color: colors.textMuted, fontWeight: '600' },

  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  chipTexto: { fontSize: 11, fontWeight: '700' },
  fecha: { ...typography.caption, fontSize: 11 },
})
