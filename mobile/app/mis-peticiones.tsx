import { useCallback, useState } from 'react'
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { api } from '../src/api/client'
import { Pantalla } from '../src/components/Pantalla'
import { TrabajoCard, type Trabajo } from '../src/components/TrabajoCard'
import { colors, spacing, typography } from '../src/theme'

export default function MisPeticiones() {
  const router = useRouter()
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    try {
      setTrabajos(await api.get<Trabajo[]>('/trabajos'))
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar tus peticiones.')
    } finally {
      setCargando(false)
      setRefrescando(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  return (
    <Pantalla
      titulo="Mis peticiones"
      subtitulo="Tus solicitudes, en curso y pasadas"
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.volver}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
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
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={[typography.caption, s.vacioTexto]}>
                {error !== '' ? error : 'Todavía no hiciste ninguna petición.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TrabajoCard trabajo={item} verContraparte="profesional" />
          )}
        />
      )}
    </Pantalla>
  )
}

const s = StyleSheet.create({
  volver: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cargando: { marginTop: spacing.xl },
  lista: { padding: spacing.md, gap: spacing.sm },
  vacio: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  vacioTexto: { textAlign: 'center', paddingHorizontal: spacing.lg },
})
