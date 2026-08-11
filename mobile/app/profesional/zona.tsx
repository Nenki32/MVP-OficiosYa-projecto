import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { profesionalesApi, type PerfilProfesional } from '../../src/api/profesionales'
import { Pantalla } from '../../src/components/Pantalla'
import { useUbicacion } from '../../src/hooks/useUbicacion'
import { colors, radius, spacing, typography } from '../../src/theme'

/** Opciones de radio. Cubren desde un barrio hasta media provincia. */
const RADIOS = [5, 10, 15, 25, 50, 100]

export default function Zona() {
  const router = useRouter()
  const { obtener, obteniendo, error: errorGps } = useUbicacion()

  const [perfil, setPerfil] = useState<PerfilProfesional | null>(null)
  const [radio, setRadio] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    profesionalesApi.miPerfil()
      .then(p => { setPerfil(p); setRadio(p.radioCoberturaKm) })
      .catch((e: any) => setError(e?.message ?? 'No se pudo cargar tu perfil.'))
      .finally(() => setCargando(false))
  }, [])

  const usarUbicacionActual = async () => {
    const coords = await obtener()
    if (!coords) return

    setError('')
    try {
      setPerfil(await profesionalesApi.actualizarUbicacion(coords.latitud, coords.longitud))
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar la ubicación.')
    }
  }

  const guardarRadio = async (km: number) => {
    if (!perfil) return
    setRadio(km)
    setError('')
    setGuardando(true)
    try {
      setPerfil(await profesionalesApi.actualizarPerfil({
        nombre: perfil.nombre,
        telefono: perfil.telefono,
        tipoPerfil: perfil.tipoPerfil,
        razonSocial: perfil.razonSocial,
        cuit: perfil.cuit,
        descripcion: perfil.descripcion,
        radioCoberturaKm: km,
        disponible: perfil.disponible,
      }))
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar el radio.')
      setRadio(perfil.radioCoberturaKm)
    } finally {
      setGuardando(false)
    }
  }

  const tieneUbicacion = perfil?.latitud != null

  return (
    <Pantalla
      titulo="Mi zona de trabajo"
      subtitulo="Desde dónde salís y hasta dónde viajás"
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={s.contenido}>
          {/* Punto de partida */}
          <Text style={typography.heading}>Punto de partida</Text>
          <Text style={typography.caption}>
            Usamos tu ubicación solo para mostrarte trabajos cercanos. No se
            comparte con los clientes.
          </Text>

          <View style={[s.card, tieneUbicacion && s.cardOk]}>
            <View style={s.cardFila}>
              <Ionicons
                name={tieneUbicacion ? 'location' : 'location-outline'}
                size={22}
                color={tieneUbicacion ? colors.primaryDark : colors.textMuted}
              />
              <View style={s.flex}>
                <Text style={typography.bodyStrong}>
                  {tieneUbicacion ? 'Ubicación definida' : 'Sin ubicación'}
                </Text>
                <Text style={typography.caption}>
                  {tieneUbicacion
                    ? `${perfil!.latitud!.toFixed(5)}, ${perfil!.longitud!.toFixed(5)}`
                    : 'Necesitamos tu ubicación para el filtrado por cercanía'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={usarUbicacionActual}
              disabled={obteniendo}
              style={({ pressed }) => [s.accion, pressed && s.presionada]}
            >
              {obteniendo
                ? <ActivityIndicator color={colors.primaryDark} />
                : <>
                    <Ionicons name="navigate" size={18} color={colors.primaryDark} />
                    <Text style={s.accionTexto}>
                      {tieneUbicacion ? 'Actualizar con mi ubicación' : 'Usar mi ubicación actual'}
                    </Text>
                  </>}
            </Pressable>
          </View>

          {errorGps !== '' && (
            <View style={s.aviso}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={s.avisoTexto}>{errorGps}</Text>
            </View>
          )}

          <View style={s.separador} />

          {/* Radio de accion */}
          <Text style={typography.heading}>Radio de acción</Text>
          <Text style={typography.caption}>
            Hasta cuántos kilómetros estás dispuesto a viajar.
          </Text>

          <View style={s.radios}>
            {RADIOS.map(km => {
              const activo = radio === km
              return (
                <Pressable
                  key={km}
                  onPress={() => guardarRadio(km)}
                  disabled={guardando}
                  style={[s.radio, activo && s.radioActivo]}
                >
                  <Text style={[s.radioTexto, activo && s.radioTextoActivo]}>
                    {km} km
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {error !== '' && <Text style={s.error}>{error}</Text>}

          {tieneUbicacion && radio != null && (
            <View style={s.resumen}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={s.resumenTexto}>
                Vas a ver trabajos hasta {radio} km de tu ubicación.
              </Text>
            </View>
          )}
        </ScrollView>
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
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md, marginTop: spacing.sm,
  },
  cardOk: { borderColor: colors.primary },
  cardFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  accion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, paddingVertical: spacing.md,
  },
  accionTexto: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  presionada: { opacity: 0.75 },

  aviso: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: '#FFF7E6', borderColor: colors.warning, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  avisoTexto: { flex: 1, color: '#8A5A00', fontSize: 13 },

  separador: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },

  radios: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  radio: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioActivo: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioTexto: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  radioTextoActivo: { color: colors.textOnPrimary },

  error: { color: colors.danger, fontSize: 14, marginTop: spacing.sm },

  resumen: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.lg,
  },
  resumenTexto: { flex: 1, color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
})
