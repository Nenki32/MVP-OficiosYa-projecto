import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/auth/AuthContext'
import { colors, radius, spacing } from '../../src/theme'

/**
 * Cliente y profesional usan el mismo esqueleto visual pero son, en los hechos,
 * dos apps distintas. Las tabs se arman segun el rol.
 */
export default function TabsLayout() {
  const { usuario, cargando } = useAuth()

  if (cargando) return null
  if (!usuario) return <Redirect href="/login" />

  const esProfesional = usuario.rol === 'profesional'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: esProfesional ? 'Trabajos' : 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
