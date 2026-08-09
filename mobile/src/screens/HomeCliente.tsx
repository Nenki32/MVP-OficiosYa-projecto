import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { Servicio } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import { Pantalla } from '../components/Pantalla'
import { SelectorRubro } from '../components/SelectorRubro'
import { colors, radius, spacing, typography } from '../theme'

export function HomeCliente() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [rubro, setRubro] = useState<Servicio | null>(null)

  const primerNombre = usuario?.nombre?.split(' ')[0] ?? ''

  return (
    <Pantalla
      titulo={`¡Hola, ${primerNombre}!`}
      derecha={
        <Pressable style={s.campana} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={s.contenido}>
        <Text style={typography.heading}>¿En qué podemos ayudarte?</Text>
        <Text style={typography.caption}>
          Elegí el rubro y te conectamos con profesionales cerca tuyo.
        </Text>

        <View style={s.selector}>
          <SelectorRubro servicioSeleccionado={rubro} onSeleccionar={setRubro} />
        </View>

        <Pressable
          disabled={!rubro}
          onPress={() => router.push({
            pathname: '/solicitar',
            params: { servicioId: String(rubro!.id), servicioNombre: rubro!.nombre },
          })}
          style={({ pressed }) => [
            s.continuar,
            !rubro && s.continuarDeshabilitado,
            pressed && rubro && s.continuarPresionado,
          ]}
        >
          <Text style={s.continuarTexto}>Continuar</Text>
        </Pressable>

        <View style={s.separador} />

        <Text style={typography.heading}>Mis peticiones</Text>

        <Pressable
          onPress={() => router.push('/mis-peticiones')}
          style={({ pressed }) => [s.card, pressed && s.cardPresionada]}
        >
          <Text style={typography.bodyStrong}>Ver mis solicitudes</Text>
          <Text style={typography.caption}>
            Seguí el estado de los trabajos que pediste y revisá los anteriores.
          </Text>

          <View style={s.accion}>
            <Text style={s.accionTexto}>Ir a mis peticiones</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
          </View>
        </Pressable>
      </ScrollView>
    </Pantalla>
  )
}

const s = StyleSheet.create({
  campana: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  selector: { marginTop: spacing.sm },

  continuar: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  continuarDeshabilitado: { backgroundColor: colors.textMuted, opacity: 0.5 },
  continuarPresionado: { backgroundColor: colors.primaryDark },
  continuarTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },

  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardPresionada: { opacity: 0.85 },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  accionTexto: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
})
