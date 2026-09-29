import { useCallback, useState } from 'react'
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../api/client'
import type { Servicio } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import { Pantalla } from '../components/Pantalla'
import { SelectorRubro } from '../components/SelectorRubro'
import { TrabajoCard, type Trabajo } from '../components/TrabajoCard'
import { useRecargaEnFoco } from '../hooks/useRecargaEnFoco'
import { colors, radius, spacing, typography } from '../theme'

export function HomeCliente() {
  const { usuario } = useAuth()
  const router = useRouter()

  const primerNombre = usuario?.nombre?.split(' ')[0] ?? ''

  const [peticiones, setPeticiones] = useState<Trabajo[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setPeticiones(await api.get<Trabajo[]>('/trabajos'))
      setError('')
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar tus peticiones.')
    } finally {
      setCargando(false)
      setRefrescando(false)
    }
  }, [])

  useRecargaEnFoco(cargar)

  // Elegir un rubro es, en si mismo, la accion: lleva directo al alta.
  // El selector no recuerda nada (siempre recibe null), asi que al volver
  // queda otra vez en su estado inicial.
  const irASolicitar = (rubro: Servicio) =>
    router.push({
      pathname: '/agendar',
      params: { servicioId: String(rubro.id), servicioNombre: rubro.nombre },
    })

  return (
    <Pantalla
      titulo={`¡Hola, ${primerNombre}!`}
      derecha={
        <Pressable style={s.campana} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={s.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar() }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={typography.heading}>¿En qué podemos ayudarte?</Text>
        <Text style={typography.caption}>
          Elegí el rubro y te conectamos con profesionales cerca tuyo.
        </Text>

        <View style={s.selector}>
          <SelectorRubro servicioSeleccionado={null} onSeleccionar={irASolicitar} />
        </View>

        <View style={s.separador} />

        <Text style={typography.heading}>Mis peticiones</Text>

        {cargando ? (
          <ActivityIndicator style={s.cargando} color={colors.primary} />
        ) : peticiones.length === 0 ? (
          <Text style={typography.caption}>
            {error || 'Todavía no hiciste ninguna petición. Elegí un rubro para empezar.'}
          </Text>
        ) : (
          <View style={s.lista}>
            {error !== '' && <Text style={s.errorTexto}>{error}</Text>}
            {peticiones.map(t => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/trabajo/${t.id}`)}
                style={({ pressed }) => pressed && s.cardPresionada}
              >
                <TrabajoCard trabajo={t} verContraparte="profesional" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Pantalla>
  )
}

const s = StyleSheet.create({
  campana: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  selector: { marginTop: spacing.sm },

  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  cargando: { marginTop: spacing.md },
  lista: { gap: spacing.sm, marginTop: spacing.xs },
  cardPresionada: { opacity: 0.85 },
  errorTexto: { color: colors.danger, fontSize: 14 },
})
