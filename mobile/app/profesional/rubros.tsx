import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { iconoDeServicio, serviciosApi, type Servicio } from '../../src/api/servicios'
import { profesionalesApi } from '../../src/api/profesionales'
import { Pantalla } from '../../src/components/Pantalla'
import { colors, radius, spacing, typography } from '../../src/theme'

export default function Rubros() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [elegidos, setElegidos] = useState<Set<number>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([serviciosApi.listar(), profesionalesApi.miPerfil()])
      .then(([catalogo, perfil]) => {
        setServicios(catalogo)
        setElegidos(new Set(perfil.servicios.map(s => s.id)))
      })
      .catch((e: any) => setError(e?.message ?? 'No se pudieron cargar los rubros.'))
      .finally(() => setCargando(false))
  }, [])

  const alternar = (id: number) => {
    setElegidos(previos => {
      const copia = new Set(previos)
      copia.has(id) ? copia.delete(id) : copia.add(id)
      return copia
    })
  }

  const guardar = async () => {
    if (elegidos.size === 0) return
    setError('')
    setGuardando(true)
    try {
      await profesionalesApi.actualizarServicios([...elegidos])
      router.back()
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron guardar los rubros.')
      setGuardando(false)
    }
  }

  return (
    <Pantalla
      titulo="Mis rubros"
      subtitulo="En qué oficios trabajás"
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
      ) : (
        <>
          <FlatList
            data={servicios}
            keyExtractor={x => String(x.id)}
            contentContainerStyle={s.lista}
            ListHeaderComponent={
              <Text style={[typography.caption, s.ayuda]}>
                Vas a ver solo los trabajos de los rubros que elijas. Podés marcar
                todos los que hagas.
              </Text>
            }
            renderItem={({ item }) => {
              const activo = elegidos.has(item.id)
              return (
                <Pressable
                  onPress={() => alternar(item.id)}
                  style={({ pressed }) => [
                    s.opcion, activo && s.opcionActiva, pressed && s.presionada,
                  ]}
                >
                  <View style={[s.icono, activo && s.iconoActivo]}>
                    <Ionicons
                      name={iconoDeServicio(item.nombre) as any}
                      size={20}
                      color={activo ? colors.textOnPrimary : colors.primaryDark}
                    />
                  </View>

                  <View style={s.flex}>
                    <Text style={typography.bodyStrong}>{item.nombre}</Text>
                    {item.descripcion && (
                      <Text style={typography.caption} numberOfLines={1}>
                        {item.descripcion}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name={activo ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={activo ? colors.primary : colors.border}
                  />
                </Pressable>
              )
            }}
          />

          <View style={[s.pie, { paddingBottom: insets.bottom + spacing.md }]}>
            {error !== '' && <Text style={s.error}>{error}</Text>}

            <Pressable
              onPress={guardar}
              disabled={elegidos.size === 0 || guardando}
              style={({ pressed }) => [
                s.guardar,
                (elegidos.size === 0 || guardando) && s.guardarDeshabilitado,
                pressed && s.presionada,
              ]}
            >
              {guardando
                ? <ActivityIndicator color={colors.textOnPrimary} />
                : <Text style={s.guardarTexto}>
                    Guardar {elegidos.size > 0 ? `(${elegidos.size})` : ''}
                  </Text>}
            </Pressable>
          </View>
        </>
      )}
    </Pantalla>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  cerrar: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cargando: { marginTop: spacing.xl },
  lista: { padding: spacing.md, gap: spacing.sm },
  ayuda: { marginBottom: spacing.sm },

  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  presionada: { opacity: 0.75 },

  icono: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  iconoActivo: { backgroundColor: colors.primary },

  pie: {
    padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  error: { color: colors.danger, fontSize: 14 },
  guardar: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  guardarDeshabilitado: { backgroundColor: colors.textMuted, opacity: 0.5 },
  guardarTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
})
