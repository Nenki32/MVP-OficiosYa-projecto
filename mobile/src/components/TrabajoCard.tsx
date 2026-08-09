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
  creadoEn: string
}

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

/**
 * Fila de un trabajo. El icono sale del rubro y el color del chip, del estado.
 * Componente sin estado: solo recibe datos y dibuja.
 */
export function TrabajoCard({
  trabajo,
  verContraparte,
}: {
  trabajo: Trabajo
  /** A quien mostrar debajo del rubro: el cliente o el profesional. */
  verContraparte: 'cliente' | 'profesional'
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
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  chipTexto: { fontSize: 11, fontWeight: '700' },
  fecha: { ...typography.caption, fontSize: 11 },
})
