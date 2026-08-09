import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { iconoDeServicio, serviciosApi, type Servicio } from '../api/servicios'
import { colors, radius, spacing, typography } from '../theme'

/**
 * Barra que muestra el rubro elegido y abre un panel inferior para cambiarlo.
 *
 * React Native no tiene un <select> nativo, asi que el desplegable es un Modal
 * con la lista adentro. Da control total sobre el estilo y no suma dependencias.
 *
 * El componente no guarda el rubro elegido: lo recibe y avisa cuando cambia
 * (state hoisting). Asi la pantalla que lo usa es la dueña del estado.
 */
export function SelectorRubro({
  servicioSeleccionado,
  onSeleccionar,
}: {
  servicioSeleccionado: Servicio | null
  onSeleccionar: (s: Servicio) => void
}) {
  const insets = useSafeAreaInsets()
  const [abierto, setAbierto] = useState(false)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    serviciosApi.listar()
      .then(setServicios)
      .catch((e: any) => setError(e?.message ?? 'No se pudieron cargar los rubros.'))
      .finally(() => setCargando(false))
  }, [])

  const elegir = (s: Servicio) => {
    onSeleccionar(s)
    setAbierto(false)
  }

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        style={({ pressed }) => [s.barra, pressed && s.barraPresionada]}
      >
        <View style={s.barraIzq}>
          <View style={s.iconoCirculo}>
            <Ionicons
              name={(servicioSeleccionado
                ? iconoDeServicio(servicioSeleccionado.nombre)
                : 'search-outline') as any}
              size={20}
              color={colors.primaryDark}
            />
          </View>
          <View style={s.flexShrink}>
            <Text style={s.barraEtiqueta}>¿Qué necesitás?</Text>
            <Text style={s.barraValor} numberOfLines={1}>
              {servicioSeleccionado?.nombre ?? 'Elegí un rubro'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={abierto}
        animationType="slide"
        transparent
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={s.fondo} onPress={() => setAbierto(false)} />

        <View style={[s.panel, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={s.agarre} />
          <Text style={[typography.heading, s.panelTitulo]}>Elegí un rubro</Text>

          {cargando ? (
            <ActivityIndicator color={colors.primary} style={s.cargando} />
          ) : error !== '' ? (
            <Text style={[typography.caption, s.panelTitulo]}>{error}</Text>
          ) : (
            <FlatList
              data={servicios}
              keyExtractor={x => String(x.id)}
              contentContainerStyle={s.lista}
              renderItem={({ item }) => {
                const activo = item.id === servicioSeleccionado?.id
                return (
                  <Pressable
                    onPress={() => elegir(item)}
                    style={({ pressed }) => [
                      s.opcion,
                      activo && s.opcionActiva,
                      pressed && s.opcionPresionada,
                    ]}
                  >
                    <View style={s.iconoCirculo}>
                      <Ionicons
                        name={iconoDeServicio(item.nombre) as any}
                        size={20}
                        color={colors.primaryDark}
                      />
                    </View>
                    <View style={s.flexShrink}>
                      <Text style={typography.bodyStrong}>{item.nombre}</Text>
                      {item.descripcion && (
                        <Text style={typography.caption} numberOfLines={1}>
                          {item.descripcion}
                        </Text>
                      )}
                    </View>
                    {activo && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </Pressable>
                )
              }}
            />
          )}
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  flexShrink: { flexShrink: 1 },

  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    // Sombra suave: la barra "flota" sobre el fondo
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  barraPresionada: { backgroundColor: colors.surfaceAlt },
  barraIzq: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  barraEtiqueta: { ...typography.caption, fontSize: 12 },
  barraValor: { ...typography.bodyStrong, fontSize: 16 },

  iconoCirculo: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    maxHeight: '75%',
  },
  agarre: {
    alignSelf: 'center',
    width: 44, height: 5, borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  panelTitulo: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  cargando: { paddingVertical: spacing.xl },
  lista: { padding: spacing.md, gap: spacing.sm },

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  opcionPresionada: { opacity: 0.7 },
})
