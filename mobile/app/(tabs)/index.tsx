import { useCallback, useState } from 'react'
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../src/api/client'
import { useAuth } from '../../src/auth/AuthContext'
import { colors, formatEstado, radius, spacing, typography } from '../../src/theme'

interface Trabajo {
  id: number
  clienteNombre: string
  profesionalNombre: string | null
  servicioNombre: string
  estado: string
  tipoPago: string
  direccionDestino: string | null
  creadoEn: string
}

export default function Home() {
  const { usuario } = useAuth()
  const insets = useSafeAreaInsets()

  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    try {
      setTrabajos(await api.get<Trabajo[]>('/trabajos'))
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los trabajos.')
    } finally {
      setCargando(false)
      setRefrescando(false)
    }
  }, [])

  // Recarga cada vez que la pantalla vuelve a estar visible.
  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const esProfesional = usuario?.rol === 'profesional'

  return (
    <View style={s.flex}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={s.saludo}>Hola, {usuario?.nombre?.split(' ')[0]}</Text>
        <Text style={s.subtitulo}>
          {esProfesional ? 'Trabajos disponibles' : 'Tus solicitudes'}
        </Text>
      </View>

      <View style={s.sheet}>
        {cargando ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
        ) : (
          <FlatList
            data={trabajos}
            keyExtractor={t => String(t.id)}
            contentContainerStyle={s.lista}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={() => { setRefrescando(true); cargar() }}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={s.vacio}>
                <Text style={typography.caption}>
                  {error !== '' ? error : 'Todavía no hay trabajos.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.cardFila}>
                  <Text style={typography.bodyStrong}>{item.servicioNombre}</Text>
                  <View style={[s.chip, { backgroundColor: (colors.estado[item.estado] ?? colors.textMuted) + '22' }]}>
                    <Text style={[s.chipTexto, { color: colors.estado[item.estado] ?? colors.textMuted }]}>
                      {formatEstado(item.estado)}
                    </Text>
                  </View>
                </View>
                <Text style={typography.caption}>
                  {esProfesional ? item.clienteNombre : (item.profesionalNombre ?? 'Sin asignar')}
                </Text>
                {item.direccionDestino && (
                  <Text style={typography.caption}>{item.direccionDestino}</Text>
                )}
              </View>
            )}
          />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  saludo: { fontSize: 24, fontWeight: '800', color: colors.textOnPrimary },
  subtitulo: { fontSize: 14, color: colors.textOnPrimary, opacity: 0.9, marginTop: 2 },

  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  lista: { padding: spacing.md, gap: spacing.sm },
  vacio: { alignItems: 'center', paddingVertical: spacing.xxl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  chipTexto: { fontSize: 11, fontWeight: '700' },
})
