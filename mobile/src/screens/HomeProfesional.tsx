import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Pantalla } from '../components/Pantalla'
import { TrabajoCard, type Trabajo } from '../components/TrabajoCard'
import { colors, spacing, typography } from '../theme'

export function HomeProfesional() {
  const { usuario } = useAuth()
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

  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  return (
    <Pantalla
      titulo={`¡Hola, ${usuario?.nombre?.split(' ')[0] ?? ''}!`}
      subtitulo="Trabajos disponibles cerca tuyo"
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
              <Text style={typography.caption}>
                {error !== '' ? error : 'Todavía no hay trabajos disponibles.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <TrabajoCard trabajo={item} verContraparte="cliente" />}
        />
      )}
    </Pantalla>
  )
}

const s = StyleSheet.create({
  cargando: { marginTop: spacing.xl },
  lista: { padding: spacing.md, gap: spacing.sm },
  vacio: { alignItems: 'center', paddingVertical: spacing.xxl },
})
