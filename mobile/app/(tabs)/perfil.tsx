import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../src/auth/AuthContext'
import { colors, radius, spacing, typography } from '../../src/theme'

export default function Perfil() {
  const { usuario, logout } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const esPremium = usuario?.nivelProfesional === 'premium'

  const salir = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <View style={s.flex}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={s.titulo}>Perfil</Text>
      </View>

      <View style={s.sheet}>
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={typography.heading}>{usuario?.nombre}</Text>
          <Text style={typography.caption}>{usuario?.email}</Text>

          <View style={s.badges}>
            <View style={s.badge}>
              <Text style={s.badgeTexto}>{usuario?.rol}</Text>
            </View>
            {usuario?.rol === 'profesional' && (
              <View style={[s.badge, esPremium ? s.badgeMatriculado : s.badgeStandard]}>
                <Text style={[s.badgeTexto, esPremium && s.badgeTextoMatriculado]}>
                  {esPremium ? 'Matriculado' : 'Standard'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          onPress={salir}
          style={({ pressed }) => [s.salir, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.textOnPrimary },

  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarTexto: { fontSize: 28, fontWeight: '800', color: colors.primaryDark },

  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: {
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: colors.surfaceAlt,
  },
  badgeStandard: { backgroundColor: colors.accentSoft },
  badgeMatriculado: { backgroundColor: colors.primarySoft },
  badgeTexto: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  badgeTextoMatriculado: { color: colors.primaryDark },

  salir: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  salirTexto: { color: colors.danger, fontSize: 15, fontWeight: '700' },
})
