import { useEffect, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { profesionalesApi, type PerfilProfesional } from '../../src/api/profesionales'
import { Pantalla } from '../../src/components/Pantalla'
import { colors, radius, spacing, typography } from '../../src/theme'

export default function EditarPerfil() {
  const router = useRouter()

  const [perfil, setPerfil] = useState<PerfilProfesional | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [disponible, setDisponible] = useState(true)

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    profesionalesApi.miPerfil()
      .then(p => {
        setPerfil(p)
        setNombre(p.nombre)
        setTelefono(p.telefono ?? '')
        setDescripcion(p.descripcion ?? '')
        setDisponible(p.disponible)
      })
      .catch((e: any) => setError(e?.message ?? 'No se pudo cargar tu perfil.'))
      .finally(() => setCargando(false))
  }, [])

  const puedeGuardar = nombre.trim().length > 0 && !guardando

  const guardar = async () => {
    if (!puedeGuardar || !perfil) return
    setError('')
    setGuardando(true)
    try {
      await profesionalesApi.actualizarPerfil({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        // El tipo de perfil no se edita todavia: se conserva el que tenga.
        tipoPerfil: perfil.tipoPerfil,
        razonSocial: perfil.razonSocial,
        cuit: perfil.cuit,
        descripcion: descripcion.trim() || null,
        radioCoberturaKm: perfil.radioCoberturaKm,
        disponible,
      })
      router.back()
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron guardar los cambios.')
      setGuardando(false)
    }
  }

  return (
    <Pantalla
      titulo="Editar perfil"
      subtitulo="Cómo te ven los clientes"
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
      ) : (
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
            <View style={s.campo}>
              <Text style={s.label}>Nombre *</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre y apellido"
                placeholderTextColor={colors.textMuted}
                style={s.input}
              />
            </View>

            <View style={s.campo}>
              <Text style={s.label}>Teléfono</Text>
              <TextInput
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Para que el cliente te contacte"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={s.input}
              />
            </View>

            <View style={s.campo}>
              <Text style={s.label}>Sobre tu trabajo</Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Experiencia, especialidades, cómo trabajás"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                maxLength={1000}
                style={[s.input, s.inputMultilinea]}
              />
              <Text style={s.ayuda}>
                Es lo primero que lee un cliente al comparar presupuestos. {descripcion.length}/1000
              </Text>
            </View>

            <View style={s.switchFila}>
              <View style={s.flex}>
                <Text style={typography.bodyStrong}>Disponible para trabajar</Text>
                <Text style={typography.caption}>
                  Si lo apagás dejás de recibir trabajos, sin darte de baja.
                </Text>
              </View>
              <Switch
                value={disponible}
                onValueChange={setDisponible}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>

            {perfil?.numeroMatricula && (
              <View style={s.matricula}>
                <Ionicons name="ribbon-outline" size={20} color={colors.primaryDark} />
                <View style={s.flex}>
                  <Text style={typography.bodyStrong}>Matrícula {perfil.numeroMatricula}</Text>
                  <Text style={typography.caption}>
                    La matrícula se verifica aparte y no se edita desde acá.
                  </Text>
                </View>
              </View>
            )}

            {error !== '' && (
              <View style={s.error}>
                <Text style={s.errorTexto}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={guardar}
              disabled={!puedeGuardar}
              style={({ pressed }) => [
                s.guardar,
                !puedeGuardar && s.guardarDeshabilitado,
                pressed && puedeGuardar && s.presionada,
              ]}
            >
              {guardando
                ? <ActivityIndicator color={colors.textOnPrimary} />
                : <Text style={s.guardarTexto}>Guardar cambios</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
  contenido: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

  campo: { gap: spacing.xs },
  label: { ...typography.caption, fontWeight: '600' },
  ayuda: { ...typography.caption, fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 15, color: colors.text,
  },
  inputMultilinea: { minHeight: 110, textAlignVertical: 'top' },

  switchFila: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },

  matricula: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md,
  },

  error: {
    backgroundColor: '#FDECEC', borderColor: colors.danger, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md,
  },
  errorTexto: { color: colors.danger, fontSize: 14 },

  guardar: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  guardarDeshabilitado: { backgroundColor: colors.textMuted, opacity: 0.5 },
  presionada: { backgroundColor: colors.primaryDark },
  guardarTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
})
