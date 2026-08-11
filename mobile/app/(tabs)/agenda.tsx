import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { api } from '../../src/api/client'
import { iconoDeServicio } from '../../src/api/servicios'
import { Calendario, formatFechaLarga, hoyIso } from '../../src/components/Calendario'
import { Pantalla } from '../../src/components/Pantalla'
import type { Trabajo } from '../../src/components/TrabajoCard'
import { colors, formatEstado, radius, spacing, typography } from '../../src/theme'

/** Fecha ISO local ("AAAA-MM-DD") de una fecha con hora en UTC. */
const diaDe = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const horaDe = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function Agenda() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [dia, setDia] = useState(hoyIso())
  const [cargando, setCargando] = useState(true)

  useFocusEffect(useCallback(() => {
    let vivo = true
    api.get<Trabajo[]>('/trabajos')
      .then(t => { if (vivo) setTrabajos(t) })
      .catch(() => { /* la agenda es informativa: si falla, no bloquea */ })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, []))

  // Solo los trabajos que el profesional tomó: la agenda es de lo comprometido,
  // no de lo disponible.
  const mios = useMemo(
    () => trabajos.filter(t => t.profesionalNombre != null && t.estado !== 'cancelado'),
    [trabajos],
  )

  const conFecha = useMemo(() => mios.filter(t => t.fechaVisita != null), [mios])
  const sinFecha = useMemo(() => mios.filter(t => t.fechaVisita == null), [mios])

  /** Días que tienen al menos un trabajo, para marcarlos en el calendario. */
  const marcas = useMemo(() => {
    const m: Record<string, { marked: boolean }> = {}
    conFecha.forEach(t => { m[diaDe(t.fechaVisita!)] = { marked: true } })
    return m
  }, [conFecha])

  const delDia = useMemo(
    () => conFecha
      .filter(t => diaDe(t.fechaVisita!) === dia)
      .sort((a, b) => a.fechaVisita!.localeCompare(b.fechaVisita!)),
    [conFecha, dia],
  )

  return (
    <Pantalla titulo="Mi agenda" subtitulo="Los trabajos que tomaste">
      {cargando ? (
        <ActivityIndicator style={s.cargando} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={s.contenido}>
          {/* Los trabajos sin fecha van arriba: si solo estuvieran en el
              calendario no aparecerían en ningún día y se perderían. */}
          {sinFecha.length > 0 && (
            <View style={s.sinFecha}>
              <View style={s.sinFechaTitulo}>
                <Ionicons name="alert-circle" size={18} color={colors.warning} />
                <Text style={s.sinFechaTexto}>
                  {sinFecha.length} trabajo{sinFecha.length > 1 ? 's' : ''} sin fecha
                </Text>
              </View>
              {sinFecha.map(t => (
                <Text key={t.id} style={s.sinFechaItem}>
                  • {t.servicioNombre} — {t.clienteNombre}
                </Text>
              ))}
            </View>
          )}

          <Calendario seleccionado={dia} onSeleccionar={setDia} marcas={marcas} />

          <Text style={[typography.heading, s.seccion]}>
            {dia === hoyIso() ? 'Hoy' : formatFechaLarga(dia)}
          </Text>

          {delDia.length === 0 ? (
            <View style={s.vacio}>
              <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
              <Text style={[typography.caption, s.vacioTexto]}>
                No tenés trabajos agendados este día.
              </Text>
            </View>
          ) : (
            delDia.map(t => {
              const color = colors.estado[t.estado] ?? colors.textMuted
              return (
                <View key={t.id} style={s.turno}>
                  <View style={s.horaColumna}>
                    <Text style={s.hora}>{horaDe(t.fechaVisita!)}</Text>
                    <View style={[s.linea, { backgroundColor: color }]} />
                  </View>

                  <View style={s.turnoCuerpo}>
                    <View style={s.turnoFila}>
                      <View style={s.icono}>
                        <Ionicons
                          name={iconoDeServicio(t.servicioNombre) as any}
                          size={18}
                          color={colors.primaryDark}
                        />
                      </View>
                      <View style={s.flex}>
                        <Text style={typography.bodyStrong}>{t.servicioNombre}</Text>
                        <Text style={typography.caption}>{t.clienteNombre}</Text>
                      </View>
                      <View style={[s.chip, { backgroundColor: color + '22' }]}>
                        <Text style={[s.chipTexto, { color }]}>{formatEstado(t.estado)}</Text>
                      </View>
                    </View>

                    {t.direccionDestino && (
                      <View style={s.direccion}>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        <Text style={typography.caption} numberOfLines={1}>
                          {t.direccionDestino}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </Pantalla>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  cargando: { marginTop: spacing.xl },
  contenido: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },

  sinFecha: {
    backgroundColor: '#FFF7E6', borderColor: colors.warning, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.xs,
  },
  sinFechaTitulo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sinFechaTexto: { fontSize: 14, fontWeight: '700', color: '#8A5A00' },
  sinFechaItem: { fontSize: 13, color: '#8A5A00' },

  seccion: { marginTop: spacing.lg, textTransform: 'capitalize' },

  vacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  vacioTexto: { textAlign: 'center' },

  turno: { flexDirection: 'row', gap: spacing.md },
  horaColumna: { alignItems: 'center', width: 52 },
  hora: { fontSize: 13, fontWeight: '700', color: colors.text },
  linea: { width: 3, flex: 1, borderRadius: 2, marginTop: 4, marginBottom: spacing.sm },

  turnoCuerpo: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.xs, marginBottom: spacing.sm,
  },
  turnoFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icono: {
    width: 36, height: 36, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  chipTexto: { fontSize: 11, fontWeight: '700' },
  direccion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
})
