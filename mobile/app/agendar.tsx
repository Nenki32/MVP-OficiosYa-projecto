import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { iconoDeServicio } from '../src/api/servicios'
import { Calendario, formatFechaLarga, hoyIso } from '../src/components/Calendario'
import { Pantalla } from '../src/components/Pantalla'
import { colors, radius, spacing, typography } from '../src/theme'

/**
 * Franjas horarias. Fijas y de una hora: para un oficio del hogar alcanza, y
 * evita un selector libre donde el cliente pide "a las 3:47".
 */
const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const formatHora = (h: number) => `${String(h).padStart(2, '0')}:00`

export default function Agendar() {
  const router = useRouter()
  const { servicioId, servicioNombre } = useLocalSearchParams<{
    servicioId: string
    servicioNombre: string
  }>()

  const [dia, setDia] = useState<string | undefined>()
  const [hora, setHora] = useState<number | null>(null)

  const hoy = hoyIso()
  const esHoy = dia === hoy
  const horaActual = new Date().getHours()

  const puedeSeguir = dia != null && hora != null

  const continuar = () => {
    if (!puedeSeguir) return
    router.push({
      pathname: '/solicitar',
      params: { servicioId, servicioNombre, dia: dia!, hora: String(hora) },
    })
  }

  return (
    <Pantalla
      titulo="¿Cuándo lo necesitás?"
      subtitulo={servicioNombre}
      derecha={
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.cerrar}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={s.contenido}>
        <View style={s.rubro}>
          <View style={s.rubroIcono}>
            <Ionicons
              name={iconoDeServicio(servicioNombre ?? '') as any}
              size={22}
              color={colors.primaryDark}
            />
          </View>
          <Text style={typography.bodyStrong}>{servicioNombre}</Text>
        </View>

        <Text style={typography.heading}>Elegí el día</Text>
        <Calendario seleccionado={dia} onSeleccionar={setDia} desdeHoy />

        {dia && (
          <>
            <Text style={[typography.heading, s.seccion]}>Elegí la hora</Text>
            <Text style={typography.caption}>{formatFechaLarga(dia)}</Text>

            <View style={s.horas}>
              {HORAS.map(h => {
                // Si el dia elegido es hoy, no tiene sentido ofrecer horas que
                // ya pasaron.
                const pasada = esHoy && h <= horaActual
                const activa = hora === h

                return (
                  <Pressable
                    key={h}
                    onPress={() => setHora(h)}
                    disabled={pasada}
                    style={[
                      s.hora,
                      activa && s.horaActiva,
                      pasada && s.horaPasada,
                    ]}
                  >
                    <Text style={[
                      s.horaTexto,
                      activa && s.horaTextoActivo,
                      pasada && s.horaTextoPasada,
                    ]}>
                      {formatHora(h)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {esHoy && horaActual >= 20 && (
              <Text style={s.aviso}>
                Ya no quedan horarios para hoy. Elegí otro día.
              </Text>
            )}
          </>
        )}

        <Pressable
          onPress={continuar}
          disabled={!puedeSeguir}
          style={({ pressed }) => [
            s.continuar,
            !puedeSeguir && s.continuarDeshabilitado,
            pressed && puedeSeguir && s.presionado,
          ]}
        >
          <Text style={s.continuarTexto}>
            {puedeSeguir ? `Continuar · ${formatHora(hora!)}` : 'Elegí día y hora'}
          </Text>
        </Pressable>

        <Text style={s.nota}>
          Es el horario que preferís. El profesional lo confirma al aceptar el trabajo.
        </Text>
      </ScrollView>
    </Pantalla>
  )
}

const s = StyleSheet.create({
  cerrar: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

  rubro: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rubroIcono: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  seccion: { marginTop: spacing.lg },

  horas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  hora: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  horaActiva: { borderColor: colors.primary, backgroundColor: colors.primary },
  horaPasada: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  horaTexto: { fontSize: 14, fontWeight: '600', color: colors.text },
  horaTextoActivo: { color: colors.textOnPrimary },
  horaTextoPasada: { color: colors.border },

  aviso: { ...typography.caption, marginTop: spacing.sm },

  continuar: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl,
  },
  continuarDeshabilitado: { backgroundColor: colors.textMuted, opacity: 0.5 },
  presionado: { backgroundColor: colors.primaryDark },
  continuarTexto: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },

  nota: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
})
