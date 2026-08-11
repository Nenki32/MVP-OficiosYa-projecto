import { useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../src/api/client'
import { iconoDeServicio } from '../src/api/servicios'
import { aFechaLocal, formatFechaLarga } from '../src/components/Calendario'
import { Pantalla } from '../src/components/Pantalla'
import { describirUbicacion, useUbicacion, type Coordenadas } from '../src/hooks/useUbicacion'
import { colors, radius, spacing, typography } from '../src/theme'

const TIPOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
]

export default function Solicitar() {
  const router = useRouter()
  const { servicioId, servicioNombre, dia, hora } = useLocalSearchParams<{
    servicioId: string
    servicioNombre: string
    dia?: string
    hora?: string
  }>()

  const { obtener, obteniendo, error: errorGps } = useUbicacion()

  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [tipoPago, setTipoPago] = useState('efectivo')
  const [coords, setCoords] = useState<Coordenadas | null>(null)
  const [zona, setZona] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const puedeEnviar = direccion.trim().length > 0 && !enviando

  const ubicarme = async () => {
    const c = await obtener()
    if (!c) return
    setCoords(c)
    setZona(await describirUbicacion(c.latitud, c.longitud))
  }

  const enviar = async () => {
    if (!puedeEnviar) return
    setError('')
    setEnviando(true)
    try {
      await api.post('/trabajos', {
        servicioId: Number(servicioId),
        descripcion: descripcion.trim() || null,
        direccionDestino: direccion.trim(),
        tipoPago,
        // Sin coordenadas el pedido se publica igual, pero no aparece en las
        // busquedas por cercania de los profesionales.
        latitudDestino: coords?.latitud ?? null,
        longitudDestino: coords?.longitud ?? null,
        // Fecha propuesta por el cliente. Se envia en ISO con zona horaria
        // para que el servidor la interprete sin ambiguedad.
        fechaVisita: dia && hora ? aFechaLocal(dia, Number(hora)).toISOString() : null,
      })
      router.replace('/mis-peticiones')
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo crear la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pantalla
      titulo="Nueva petición"
      subtitulo={servicioNombre}
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
          <View style={s.rubro}>
            <View style={s.rubroIcono}>
              <Ionicons
                name={iconoDeServicio(servicioNombre ?? '') as any}
                size={22}
                color={colors.primaryDark}
              />
            </View>
            <View style={s.flex}>
              <Text style={typography.bodyStrong}>{servicioNombre}</Text>
              {dia && hora && (
                <Text style={typography.caption}>
                  {formatFechaLarga(dia)} · {String(hora).padStart(2, '0')}:00
                </Text>
              )}
            </View>
          </View>

          {/* Ubicacion: es lo que permite que los profesionales cercanos
              encuentren el pedido. Sin esto no aparece en sus busquedas. */}
          <View style={[s.ubicacion, coords && s.ubicacionOk]}>
            <View style={s.ubicacionFila}>
              <Ionicons
                name={coords ? 'location' : 'location-outline'}
                size={22}
                color={coords ? colors.primaryDark : colors.textMuted}
              />
              <View style={s.flex}>
                <Text style={typography.bodyStrong}>
                  {coords ? 'Ubicación detectada' : 'Ubicación del trabajo'}
                </Text>
                <Text style={typography.caption}>
                  {coords
                    ? (zona ?? 'Lista para publicar')
                    : 'Sin esto, los profesionales cercanos no van a encontrarte'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={ubicarme}
              disabled={obteniendo}
              style={({ pressed }) => [s.ubicarme, pressed && { opacity: 0.75 }]}
            >
              {obteniendo
                ? <ActivityIndicator color={colors.primaryDark} />
                : <>
                    <Ionicons name="navigate" size={18} color={colors.primaryDark} />
                    <Text style={s.ubicarmeTexto}>
                      {coords ? 'Actualizar ubicación' : 'Usar mi ubicación actual'}
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

          <View style={s.campo}>
            <Text style={s.label}>Dirección *</Text>
            <TextInput
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Calle, altura, piso o depto"
              placeholderTextColor={colors.textMuted}
              style={s.input}
            />
            <Text style={s.ayuda}>
              El profesional ve la dirección exacta recién cuando lo asignás.
            </Text>
          </View>

          <View style={s.campo}>
            <Text style={s.label}>¿Qué necesitás?</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Contá brevemente el problema"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[s.input, s.inputMultilinea]}
            />
          </View>

          <View style={s.campo}>
            <Text style={s.label}>Forma de pago</Text>
            <View style={s.opciones}>
              {TIPOS_PAGO.map(t => {
                const activo = t.valor === tipoPago
                return (
                  <Pressable
                    key={t.valor}
                    onPress={() => setTipoPago(t.valor)}
                    style={[s.opcion, activo && s.opcionActiva]}
                  >
                    <Text style={[s.opcionTexto, activo && s.opcionTextoActivo]}>
                      {t.etiqueta}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {error !== '' && (
            <View style={s.error}>
              <Text style={s.errorTexto}>{error}</Text>
            </View>
          )}

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
              : <Text style={s.enviarTexto}>Publicar petición</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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


  ubicacion: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
  },
  ubicacionOk: { borderColor: colors.primary },
  ubicacionFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ubicarme: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, paddingVertical: spacing.md,
  },
  ubicarmeTexto: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },

  aviso: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: '#FFF7E6', borderColor: colors.warning, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md,
  },
  avisoTexto: { flex: 1, color: '#8A5A00', fontSize: 13 },

  campo: { gap: spacing.xs },
  label: { ...typography.caption, fontWeight: '600' },
  ayuda: { ...typography.caption, fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 15, color: colors.text,
  },
  inputMultilinea: { minHeight: 96, textAlignVertical: 'top' },

  opciones: { flexDirection: 'row', gap: spacing.sm },
  opcion: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  opcionTexto: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  opcionTextoActivo: { color: colors.primaryDark },

  error: {
    backgroundColor: '#FDECEC',
    borderColor: colors.danger, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md,
  },
  errorTexto: { color: colors.danger, fontSize: 14 },

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
})
