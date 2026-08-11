import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars'
import { colors, radius, spacing } from '../theme'

// react-native-calendars viene en ingles. Se configura una sola vez, aca,
// para que todas las pantallas usen el mismo idioma y formato.
LocaleConfig.locales.es = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
}
LocaleConfig.defaultLocale = 'es'

/** Fecha de hoy como "AAAA-MM-DD", que es el formato que usa la librería. */
export const hoyIso = () => new Date().toISOString().split('T')[0]

/**
 * Convierte "AAAA-MM-DD" + hora a un Date local.
 *
 * Se arma con el constructor de Date y no parseando el ISO completo: si se
 * usara `new Date("2026-08-12T14:00:00")` el navegador y el dispositivo pueden
 * interpretarlo en zonas distintas. Asi queda siempre en hora local.
 */
export const aFechaLocal = (iso: string, hora: number) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d, hora, 0, 0, 0)
}

export const formatFechaLarga = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

const tema = {
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textMuted,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textOnPrimary,
  todayTextColor: colors.primaryDark,
  dayTextColor: colors.text,
  textDisabledColor: colors.border,
  dotColor: colors.primary,
  selectedDotColor: colors.textOnPrimary,
  arrowColor: colors.primaryDark,
  monthTextColor: colors.text,
  textDayFontWeight: '500' as const,
  textMonthFontWeight: '700' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 15,
  textMonthFontSize: 17,
  textDayHeaderFontSize: 12,
}

/**
 * Calendario mensual. Envuelve la librería para que el estilo salga del sistema
 * de diseño y no quede cada pantalla configurándolo por su cuenta.
 */
export function Calendario({
  seleccionado,
  onSeleccionar,
  marcas,
  desdeHoy = false,
}: {
  /** Día elegido, en "AAAA-MM-DD". */
  seleccionado?: string
  onSeleccionar: (iso: string) => void
  /** Días con contenido, para marcarlos con un punto. */
  marcas?: Record<string, { marked?: boolean }>
  /** Si impide elegir días pasados. */
  desdeHoy?: boolean
}) {
  const marcados: Record<string, any> = { ...marcas }

  if (seleccionado) {
    marcados[seleccionado] = {
      ...marcados[seleccionado],
      selected: true,
      selectedColor: colors.primary,
    }
  }

  return (
    <Calendar
      current={seleccionado}
      minDate={desdeHoy ? hoyIso() : undefined}
      onDayPress={(d: DateData) => onSeleccionar(d.dateString)}
      markedDates={marcados}
      firstDay={1}          // la semana arranca el lunes, como en Argentina
      enableSwipeMonths
      theme={tema}
      style={{
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingBottom: spacing.sm,
      }}
    />
  )
}
