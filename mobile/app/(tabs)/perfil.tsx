import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { profesionalesApi, type PerfilProfesional } from '../../src/api/profesionales'
import { useAuth } from '../../src/auth/AuthContext'
import { Pantalla } from '../../src/components/Pantalla'
import { colors, radius, spacing, typography } from '../../src/theme'

export default function Perfil() {
  const { usuario, logout } = useAuth()
  const router = useRouter()

  const esProfesional = usuario?.rol === 'profesional'
  const [perfil, setPerfil] = useState<PerfilProfesional | null>(null)
  const [cargando, setCargando] = useState(esProfesional)

  // Se recarga al volver de las pantallas de edicion, para que lo que falta
  // quede al dia sin que el usuario tenga que hacer nada.
  useFocusEffect(useCallback(() => {
    if (!esProfesional) return
    let vivo = true
    profesionalesApi.miPerfil()
      .then(p => { if (vivo) setPerfil(p) })
      .catch(() => { /* el perfil es informativo: si falla, no bloquea */ })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [esProfesional]))

  const salir = async () => {
    await logout()
    router.replace('/login')
  }

  const esPremium = usuario?.nivelProfesional === 'premium'
  const completo = perfil?.faltantes.length === 0

  return (
    <Pantalla titulo="Perfil">
      <ScrollView contentContainerStyle={s.contenido}>
        {/* Identidad */}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>{usuario?.nombre?.charAt(0).toUpperCase()}</Text>
          </View>

          <Text style={typography.heading}>{usuario?.nombre}</Text>
          <Text style={typography.caption}>{usuario?.email}</Text>

          <View style={s.badges}>
            <View style={s.badge}>
              <Text style={s.badgeTexto}>{usuario?.rol}</Text>
            </View>
            {esProfesional && (
              <View style={[s.badge, esPremium ? s.badgeMatriculado : s.badgeStandard]}>
                <Text style={[s.badgeTexto, esPremium && s.badgeTextoMatriculado]}>
                  {esPremium ? 'Matriculado' : 'Standard'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {esProfesional && (
          cargando ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <>
              {/* Que falta para recibir trabajos */}
              {perfil && !completo && (
                <View style={s.pendientes}>
                  <View style={s.pendientesTitulo}>
                    <Ionicons name="alert-circle" size={20} color={colors.warning} />
                    <Text style={s.pendientesTexto}>Completá tu perfil</Text>
                  </View>
                  {perfil.faltantes.map((f, i) => (
                    <Text key={i} style={s.pendienteItem}>• {f}</Text>
                  ))}
                </View>
              )}

              {perfil && completo && (
                <View style={s.completo}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={s.completoTexto}>
                    Tu perfil está completo. Ya podés recibir trabajos.
                  </Text>
                </View>
              )}

              {/* Accesos */}
              <Text style={[typography.heading, s.seccion]}>Mi trabajo</Text>

              <Fila
                icono="briefcase-outline"
                titulo="Mis rubros"
                detalle={perfil?.servicios.length
                  ? perfil.servicios.map(x => x.nombre).join(', ')
                  : 'Todavía no elegiste ninguno'}
                onPress={() => router.push('/profesional/rubros')}
              />

              <Fila
                icono="location-outline"
                titulo="Mi zona de trabajo"
                detalle={perfil?.latitud != null
                  ? `Hasta ${perfil.radioCoberturaKm ?? '—'} km de tu ubicación`
                  : 'Sin ubicación definida'}
                onPress={() => router.push('/profesional/zona')}
              />

              <Fila
                icono="person-outline"
                titulo="Editar perfil"
                detalle={perfil?.disponible ? 'Disponible para trabajar' : 'No disponible'}
                onPress={() => router.push('/profesional/editar')}
              />
            </>
          )
        )}

        <Pressable
          onPress={salir}
          style={({ pressed }) => [s.salir, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </Pantalla>
  )
}

/** Fila de acceso a una pantalla. Sin estado: recibe datos y avisa el toque. */
function Fila({
  icono, titulo, detalle, onPress,
}: {
  icono: string
  titulo: string
  detalle: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.fila, pressed && { opacity: 0.75 }]}>
      <View style={s.filaIcono}>
        <Ionicons name={icono as any} size={20} color={colors.primaryDark} />
      </View>
      <View style={s.flex}>
        <Text style={typography.bodyStrong}>{titulo}</Text>
        <Text style={typography.caption} numberOfLines={1}>{detalle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
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

  pendientes: {
    backgroundColor: '#FFF7E6', borderColor: colors.warning, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, marginTop: spacing.sm,
  },
  pendientesTitulo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pendientesTexto: { fontSize: 15, fontWeight: '700', color: '#8A5A00' },
  pendienteItem: { fontSize: 13, color: '#8A5A00' },

  completo: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.sm,
  },
  completoTexto: { flex: 1, color: colors.primaryDark, fontSize: 14, fontWeight: '600' },

  seccion: { marginTop: spacing.lg, marginBottom: spacing.xs },

  fila: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  filaIcono: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  salir: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.danger,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  salirTexto: { color: colors.danger, fontSize: 15, fontWeight: '700' },
})
