import { useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../src/auth/AuthContext'
import { colors, radius, spacing, typography } from '../src/theme'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const puedeEnviar = email.trim().length > 0 && password.length > 0 && !enviando

  const onSubmit = async () => {
    if (!puedeEnviar) return
    setError('')
    setEnviando(true)
    try {
      await login(email.trim(), password)
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo iniciar sesion.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Bloque de color superior */}
      <View style={[s.header, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={s.marca}>EncoYá</Text>
        <Text style={s.tagline}>Profesionales del hogar, cerca tuyo</Text>
      </View>

      {/* Hoja clara que sube sobre el header */}
      <ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={typography.heading}>Iniciar sesión</Text>

        <View style={s.campo}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={s.input}
          />
        </View>

        <View style={s.campo}>
          <Text style={s.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={s.input}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />
        </View>

        {error !== '' && (
          <View style={s.error}>
            <Text style={s.errorTexto}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={!puedeEnviar}
          style={({ pressed }) => [
            s.boton,
            !puedeEnviar && s.botonDeshabilitado,
            pressed && puedeEnviar && s.botonPresionado,
          ]}
        >
          {enviando
            ? <ActivityIndicator color={colors.textOnPrimary} />
            : <Text style={s.botonTexto}>Entrar</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  marca: { fontSize: 34, fontWeight: '800', color: colors.textOnPrimary },
  tagline: { fontSize: 15, color: colors.textOnPrimary, opacity: 0.9, marginTop: spacing.xs },

  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  sheetContent: { padding: spacing.lg, gap: spacing.md },

  campo: { gap: spacing.xs },
  label: { ...typography.caption, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },

  error: {
    backgroundColor: '#FDECEC',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorTexto: { color: colors.danger, fontSize: 14 },

  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  botonDeshabilitado: { opacity: 0.4 },
  botonPresionado: { backgroundColor: colors.primaryDark },
  botonTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
})
