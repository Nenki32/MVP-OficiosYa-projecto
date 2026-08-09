import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../theme'

/**
 * Layout base de la app: bloque de color arriba con el titulo, y una "hoja"
 * clara que sube por encima con radio grande.
 *
 * Toda pantalla usa esto para que la jerarquia sea la misma en todos lados.
 */
export function Pantalla({
  titulo,
  subtitulo,
  derecha,
  children,
}: {
  titulo: string
  subtitulo?: string
  derecha?: ReactNode
  children: ReactNode
}) {
  const insets = useSafeAreaInsets()

  return (
    <View style={s.flex}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={s.headerFila}>
          <View style={s.flexShrink}>
            <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
            {subtitulo && <Text style={s.subtitulo}>{subtitulo}</Text>}
          </View>
          {derecha}
        </View>
      </View>

      <View style={s.sheet}>{children}</View>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  flexShrink: { flexShrink: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.textOnPrimary },
  subtitulo: {
    fontSize: 14,
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
  },
})
