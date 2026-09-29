import { useCallback, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api, ApiError } from '../../src/api/client'
import { iconoDeServicio } from '../../src/api/servicios'
import { useAuth } from '../../src/auth/AuthContext'
import { Pantalla } from '../../src/components/Pantalla'
import type { Trabajo } from '../../src/components/TrabajoCard'
import { useRecargaEnFoco } from '../../src/hooks/useRecargaEnFoco'
import { colors, formatEstado, formatMonto, radius, spacing, typography } from '../../src/theme'

interface TrabajoDetalle extends Trabajo {
  descripcion: string | null
  /** Hoy el backend manda todas; cuando se restrinja, puede venir solo la propia. */
  postulaciones?: {
    profesionalId: number
    profesionalNombre: string
    nivelProfesional: string | null
    presupuesto: number | null
  }[]
  /** Campo previsto en el ROADMAP para reemplazar la lista de postulaciones. */
  yaMePostule?: boolean
}

const formatFechaVisita = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

export default function DetalleTrabajo() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { usuario } = useAuth()

  const [trabajo, setTrabajo] = useState<TrabajoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [presupuesto, setPresupuesto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [aceptando, setAceptando] = useState<number | null>(null)

  const esCliente = usuario?.rol === 'cliente'

  const cargar = useCallback(async () => {
    setError('')
    try {
      setTrabajo(await api.get<TrabajoDetalle>(`/trabajos/${id}`))
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar el trabajo.')
    } finally {
      setCargando(false)
    }
  }, [id])

  // El cliente espera presupuestos: mientras este pendiente, se sondea.
  useRecargaEnFoco(cargar, esCliente && trabajo?.estado === 'pendiente')

  const yaPostulado = enviado || !!trabajo?.yaMePostule ||
    !!trabajo?.postulaciones?.some(p => p.profesionalId === usuario?.id)

  // Acepta "15000", "15.000" o "15000,50".
  const monto = Number(presupuesto.replace(/\./g, '').replace(',', '.'))
  const montoValido = presupuesto.trim() !== '' && Number.isFinite(monto) && monto > 0
  const puedeEnviar = montoValido && !enviando

  const enviar = async () => {
    if (!puedeEnviar) return
    setError('')
    setEnviando(true)
    try {
      await api.post(`/trabajos/${id}/postularse`, { presupuesto: monto })
      setEnviado(true)
    } catch (e: any) {
      // 409 = ya existia la postulacion: el estado real es "enviado".
      if (e instanceof ApiError && e.status === 409) setEnviado(true)
      else setError(e?.message ?? 'No se pudo enviar el presupuesto.')
    } finally {
      setEnviando(false)
    }
  }

  /** El cliente elige un presupuesto: el trabajo pasa a aceptado y entra en la agenda del profesional. */
  const aceptar = async (profesionalId: number) => {
    setError('')
    setAceptando(profesionalId)
    try {
      await api.post(`/trabajos/${id}/asignar/${profesionalId}`, {})
      await cargar()
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo aceptar el presupuesto.')
    } finally {
      setAceptando(null)
    }
  }

  return (
    <Pantalla
      titulo="Detalle del trabajo"
      subtitulo={trabajo?.servicioNombre}
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
      ) : !trabajo ? (
        <View style={s.vacio}>
          <Text style={typography.caption}>{error || 'Trabajo no encontrado.'}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
            <View style={s.rubro}>
              <View style={s.rubroIcono}>
                <Ionicons
                  name={iconoDeServicio(trabajo.servicioNombre) as any}
                  size={22}
                  color={colors.primaryDark}
                />
              </View>
              <View style={s.flex}>
                <Text style={typography.bodyStrong}>{trabajo.servicioNombre}</Text>
                <Text style={typography.caption}>{trabajo.clienteNombre}</Text>
              </View>
              <Text style={[s.estado, { color: colors.estado[trabajo.estado] ?? colors.textMuted }]}>
                {formatEstado(trabajo.estado)}
              </Text>
            </View>

            <View style={s.bloque}>
              <Text style={s.label}>Qué necesita</Text>
              <Text style={typography.body}>
                {trabajo.descripcion?.trim() || 'El cliente no agregó una descripción.'}
              </Text>
            </View>

            <View style={s.bloque}>
              <Fila icono="calendar-outline" texto={
                trabajo.fechaVisita ? formatFechaVisita(trabajo.fechaVisita) : 'Sin fecha propuesta'
              } />
              {!esCliente && (
                <Fila icono="navigate-outline" texto={
                  trabajo.distanciaKm != null ? `A ${String(trabajo.distanciaKm).replace('.', ',')} km de tu zona` : 'Sin ubicación en el mapa'
                } />
              )}
              {/* La direccion exacta solo llega cuando el trabajo esta asignado. */}
              <Fila icono="location-outline" texto={
                trabajo.direccionDestino ?? 'La dirección exacta se muestra cuando te asignan el trabajo'
              } />
              <Fila icono="wallet-outline" texto={`Pago: ${formatEstado(trabajo.tipoPago)}`} />
            </View>

            {esCliente ? (
              trabajo.estado === 'a_reprogramar' ? (
                <View style={s.bloque}>
                  <Text style={typography.body}>
                    La fecha pasó sin que aceptaras un presupuesto. Elegí una nueva: los
                    profesionales van a tener que presupuestar de nuevo.
                  </Text>
                  <Pressable
                    onPress={() => router.push({
                      pathname: '/agendar',
                      params: { servicioNombre: trabajo.servicioNombre, trabajoId: String(trabajo.id) },
                    })}
                    style={({ pressed }) => [s.enviar, pressed && s.enviarPresionado]}
                  >
                    <Text style={s.enviarTexto}>Elegir nueva fecha</Text>
                  </Pressable>
                </View>
              ) : trabajo.estado !== 'pendiente' ? (
                trabajo.profesionalNombre && (
                  <Fila icono="person-outline" texto={`Profesional: ${trabajo.profesionalNombre}`} />
                )
              ) : (
                <View style={s.bloque}>
                  <Text style={s.label}>Presupuestos recibidos</Text>
                  {!trabajo.postulaciones?.length && (
                    <Text style={typography.caption}>Todavía no recibiste presupuestos.</Text>
                  )}
                  {trabajo.postulaciones?.map(p => (
                    <View key={p.profesionalId} style={s.fila}>
                      <View style={s.flex}>
                        <Text style={typography.bodyStrong}>{p.profesionalNombre}</Text>
                        <Text style={typography.caption}>
                          {p.presupuesto != null ? formatMonto(p.presupuesto) : 'Sin monto'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => aceptar(p.profesionalId)}
                        disabled={aceptando != null}
                        style={({ pressed }) => [s.aceptar, pressed && s.enviarPresionado]}
                      >
                        {aceptando === p.profesionalId
                          ? <ActivityIndicator color={colors.textOnPrimary} />
                          : <Text style={s.aceptarTexto}>Aceptar</Text>}
                      </Pressable>
                    </View>
                  ))}
                  {error !== '' && <Text style={s.errorTexto}>{error}</Text>}
                </View>
              )
            ) : trabajo.estado !== 'pendiente' ? null : yaPostulado ? (
              <View style={s.ok}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={s.okTexto}>
                  Presupuesto enviado. Te avisamos si el cliente te elige.
                </Text>
              </View>
            ) : (
              <View style={s.bloque}>
                <Text style={s.label}>Tu presupuesto (ARS)</Text>
                <TextInput
                  value={presupuesto}
                  onChangeText={setPresupuesto}
                  placeholder="Ej: 25000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={s.input}
                />
                {montoValido && <Text style={typography.caption}>{formatMonto(monto)}</Text>}

                {error !== '' && <Text style={s.errorTexto}>{error}</Text>}

                <Pressable
                  onPress={enviar}
                  disabled={!puedeEnviar}
                  style={({ pressed }) => [
                    s.enviar,
                    !puedeEnviar && s.enviarDeshabilitado,
                    pressed && puedeEnviar && s.enviarPresionado,
                  ]}
                >
                  {enviando
                    ? <ActivityIndicator color={colors.textOnPrimary} />
                    : <Text style={s.enviarTexto}>Enviar presupuesto</Text>}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Pantalla>
  )
}

function Fila({ icono, texto }: { icono: string; texto: string }) {
  return (
    <View style={s.fila}>
      <Ionicons name={icono as any} size={18} color={colors.primaryDark} />
      <Text style={[typography.body, s.flex]}>{texto}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  cargando: { marginTop: spacing.xl },
  vacio: { alignItems: 'center', paddingVertical: spacing.xxl },
  cerrar: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  contenido: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

  rubro: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, padding: spacing.md,
  },
  rubroIcono: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  estado: { fontSize: 12, fontWeight: '700' },

  bloque: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.caption, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 15, color: colors.text,
  },
  errorTexto: { color: colors.danger, fontSize: 14 },

  ok: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, padding: spacing.md,
  },
  okTexto: { flex: 1, color: colors.primaryDark, fontSize: 14, fontWeight: '600' },

  enviar: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  enviarDeshabilitado: { backgroundColor: colors.textMuted, opacity: 0.5 },
  enviarPresionado: { backgroundColor: colors.primaryDark },
  enviarTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  aceptar: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  aceptarTexto: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
})
