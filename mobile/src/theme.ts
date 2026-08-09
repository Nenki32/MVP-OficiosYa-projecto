/**
 * Sistema de diseno de EncoYa.
 *
 * Todo color, espaciado y tamano de texto sale de aca. Ningun componente
 * define valores sueltos: si algo necesita un color nuevo, se agrega en este
 * archivo. Es lo que mantiene la app coherente cuando crece.
 */

export const colors = {
  // Primario: verde. En esta app significa "disponible / verificado",
  // no dinero (que es lo que significa en apps de finanzas).
  primary: '#00D09E',
  primaryDark: '#00A87E',
  primarySoft: '#DFF7EF',

  // Fondo y superficies
  background: '#F1FFF3',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7F9',

  // Texto
  text: '#052224',
  textMuted: '#6B7F80',
  textOnPrimary: '#FFFFFF',

  // Acento para datos y cifras
  accent: '#3299FF',
  accentSoft: '#E4F1FF',

  // Semanticos
  success: '#00B37E',
  warning: '#F4A100',
  danger: '#E5484D',
  border: '#E1EAE6',

  // Estados de un trabajo
  estado: {
    pendiente: '#F4A100',
    aceptado: '#3299FF',
    viajando: '#8B5CF6',
    en_progreso: '#F97316',
    completado: '#00B37E',
    cancelado: '#E5484D',
  } as Record<string, string>,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  // El radio grande de la "hoja" que sube sobre el header de color
  sheet: 32,
  pill: 999,
}

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  amount: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
}

/** Formatea un monto en pesos argentinos. */
export const formatMonto = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

/** "en_progreso" -> "En progreso" */
export const formatEstado = (estado: string) => {
  const s = estado.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
