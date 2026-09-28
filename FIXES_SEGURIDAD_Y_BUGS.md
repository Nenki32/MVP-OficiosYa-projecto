# IMPLEMENTACIÓN QUIRÚRGICA DE LOS 3 FIXES PRIORITARIOS — OFICIOSYA

Contiene el código completo para resolver:
1. Backend (.NET 9): Revelación por etapas de dirección/coordenadas (Seguridad #1) y ocultamiento de presupuestos de competidores (Seguridad #5).
2. Mobile (Expo): Hacer tocable la tarjeta en la lista del profesional y crear la pantalla de detalle/postulación (Bloqueo #1).
3. Mobile (Expo): Fallback con Location.geocodeAsync cuando el cliente niega el permiso de GPS pero escribe la dirección (Bug #2).

=============================================================================
FIX 1: BACKEND (.NET 9) — REVELACIÓN POR ETAPAS Y PRIVACIDAD DE POSTULACIONES
=============================================================================

1. En TrabajoDetalleDto.cs, asegurar que exista la propiedad booleana:
-----------------------------------------------------------------------------
public bool YaMePostule { get; set; }
-----------------------------------------------------------------------------

2. En TrabajoUseCase.cs (o en el servicio donde armes TrabajoDetalleDto y TrabajoDto antes de devolverlos al Controller), agregar y llamar a este método de sanitización:
-----------------------------------------------------------------------------
public static void AplicarPrivacidadPorEtapa(
    TrabajoDetalleDto dto,
    int usuarioActualId,
    string rolUsuarioActual)
{
    bool esClienteDuenio = rolUsuarioActual == "cliente" && dto.ClienteId == usuarioActualId;
    bool esProfesionalAsignado = rolUsuarioActual == "profesional" && dto.ProfesionalAsignadoId == usuarioActualId;
    bool esAdmin = rolUsuarioActual == "admin";

    // 1. Si no es el cliente dueño, ni el profesional ya asignado, ni admin: ocultar datos exactos
    if (!esClienteDuenio && !esProfesionalAsignado && !esAdmin)
    {
        dto.DireccionDestino = "Zona aproximada (dirección exacta visible al asignarse el trabajo)";
        dto.TelefonoCliente = null;

        // Redondear coordenadas a 2 decimales (~1.1 km) para no revelar la casa exacta
        if (dto.LatitudDestino.HasValue && dto.LongitudDestino.HasValue)
        {
            dto.LatitudDestino = Math.Round(dto.LatitudDestino.Value, 2);
            dto.LongitudDestino = Math.Round(dto.LongitudDestino.Value, 2);
        }
    }

    // 2. Si consulta un profesional, jamás debe recibir las postulaciones de sus competidores
    if (rolUsuarioActual == "profesional" && dto.Postulaciones != null)
    {
        dto.Postulaciones = dto.Postulaciones
            .Where(p => p.ProfesionalId == usuarioActualId)
            .ToList();

        dto.YaMePostule = dto.Postulaciones.Any();
    }
}
-----------------------------------------------------------------------------

3. En el listado general del profesional (GetByProfesionalAsync):
   Al mapear cada TrabajoDto de la lista, aplicar la misma regla: si el trabajo aún está "pendiente" (o su ProfesionalId != usuarioActualId), ocultar DireccionDestino exacta y redondear LatitudDestino y LongitudDestino a 2 decimales.

=============================================================================
FIX 2: MOBILE (EXPO) — HACER TOCABLE LA LISTA Y CREAR PANTALLA DE POSTULACIÓN
=============================================================================

PASO A: Hacer tocable la tarjeta en el listado de trabajos del profesional:
En la pantalla del profesional donde se renderiza el FlatList de trabajos, envolver la tarjeta con Pressable y navegar a la ruta dinámica:

-----------------------------------------------------------------------------
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

// Dentro del componente de la pantalla de listado:
const router = useRouter();

// En el renderItem del FlatList:
<Pressable
  onPress={() => router.push(`/profesional/trabajo/${item.id}`)}
  style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
>
  {/* Contenido actual de la tarjeta de Trabajo */}
</Pressable>
-----------------------------------------------------------------------------

PASO B: Crear el archivo mobile/app/profesional/trabajo/[id].tsx:
Conecta con GET /api/trabajos/{id} y POST /api/trabajos/{id}/postularse:

-----------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { client } from '../../../src/api/client'; // Ajustar al path real de tu cliente HTTP

export default function DetalleTrabajoProfesionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trabajo, setTrabajo] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [presupuesto, setPresupuesto] = useState('');
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    try {
      setCargando(true);
      const res = await client.get(`/trabajos/${id}`);
      setTrabajo(res.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle del trabajo.');
      router.back();
    } finally {
      setCargando(false);
    }
  };

  const enviarPresupuesto = async () => {
    const monto = parseFloat(presupuesto.replace(',', '.'));
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Atención', 'Ingresá un monto de presupuesto válido mayor a 0.');
      return;
    }

    try {
      setEnviando(true);
      await client.post(`/trabajos/${id}/postularse`, {
        presupuesto: monto,
        comentario: comentario.trim(),
      });
      Alert.alert('Presupuesto enviado', 'El cliente recibirá tu propuesta.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || 'No se pudo enviar la postulación.';
      Alert.alert('Error', msg);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trabajo) return null;

  const miPostulacion = trabajo.postulaciones?.[0];
  const yaPostulado = Boolean(trabajo.yaMePostule || miPostulacion);

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.rubro}>{trabajo.servicioNombre || 'Solicitud de servicio'}</Text>
      <Text style={styles.titulo}>{trabajo.titulo || trabajo.descripcion}</Text>

      <View style={styles.cajaInfo}>
        <Text style={styles.etiqueta}>Estado:</Text>
        <Text style={styles.valor}>{trabajo.estado}</Text>

        <Text style={styles.etiqueta}>Distancia aproximada:</Text>
        <Text style={styles.valor}>
          {trabajo.distanciaKm != null
            ? `${trabajo.distanciaKm.toFixed(1)} km`
            : 'Sin ubicación en el mapa'}
        </Text>

        <Text style={styles.etiqueta}>Ubicación:</Text>
        <Text style={styles.valor}>
          {trabajo.direccionDestino || 'Zona reservada hasta confirmación'}
        </Text>
      </View>

      {yaPostulado ? (
        <View style={styles.cajaPostulado}>
          <Text style={styles.textoPostuladoTitulo}>Ya enviaste tu presupuesto</Text>
          {miPostulacion && (
            <Text style={styles.valor}>
              Monto ofertado: ${miPostulacion.presupuesto} — "{miPostulacion.comentario}"
            </Text>
          )}
        </View>
      ) : (
        trabajo.estado === 'pendiente' && (
          <View style={styles.formulario}>
            <Text style={styles.subtitulo}>Enviar Presupuesto</Text>

            <Text style={styles.etiqueta}>Monto estimado ($ ARS)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Ej: 25000"
              value={presupuesto}
              onChangeText={setPresupuesto}
            />

            <Text style={styles.etiqueta}>Comentario / Disponibilidad</Text>
            <TextInput
              style={[styles.input, styles.inputMultilinea]}
              multiline
              numberOfLines={3}
              placeholder="Ej: Puedo pasar mañana a las 9 hs. Incluye revisión."
              value={comentario}
              onChangeText={setComentario}
            />

            <Pressable
              style={[styles.boton, enviando && styles.botonDeshabilitado]}
              onPress={enviarPresupuesto}
              disabled={enviando}
            >
              <Text style={styles.textoBoton}>
                {enviando ? 'Enviando...' : 'Postularme a este trabajo'}
              </Text>
            </Pressable>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contenedor: { padding: 16, gap: 12 },
  rubro: { fontSize: 13, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' },
  titulo: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitulo: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cajaInfo: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, gap: 4 },
  etiqueta: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 6 },
  valor: { fontSize: 15, color: '#1F2937' },
  formulario: { marginTop: 12, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputMultilinea: { minHeight: 80, textAlignVertical: 'top' },
  boton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cajaPostulado: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    gap: 4,
  },
  textoPostuladoTitulo: { fontSize: 15, fontWeight: '700', color: '#065F46' },
});
-----------------------------------------------------------------------------

=============================================================================
FIX 3: MOBILE (EXPO) — FALLBACK CON Location.geocodeAsync EN app/solicitar.tsx
=============================================================================

Cuando el cliente niega el permiso de GPS pero escribe su dirección a mano, geocodificar el texto antes de hacer el POST para que el trabajo tenga coordenadas en PostGIS:

-----------------------------------------------------------------------------
import * as Location from 'expo-location';

async function resolverCoordenadas(
  coordsGps: { latitude: number; longitude: number } | null,
  direccionEscrita: string
): Promise<{ latitud: number | null; longitud: number | null }> {
  // 1. Si el usuario otorgó GPS, usar esas coordenadas:
  if (coordsGps) {
    return {
      latitud: coordsGps.latitude,
      longitud: coordsGps.longitude,
    };
  }

  // 2. Si negó el GPS pero escribió la dirección, geocodificar el texto con el SO:
  const textoLimpio = direccionEscrita.trim();
  if (textoLimpio.length >= 5) {
    try {
      const busqueda = textoLimpio.toLowerCase().includes('argentina')
        ? textoLimpio
        : `${textoLimpio}, Argentina`;

      const resultados = await Location.geocodeAsync(busqueda);
      if (resultados && resultados.length > 0) {
        return {
          latitud: resultados[0].latitude,
          longitud: resultados[0].longitude,
        };
      }
    } catch {
      // Si falla el geocodificador nativo, continúa con null sin bloquear la publicación
    }
  }

  return { latitud: null, longitud: null };
}

// Dentro del submit en mobile/app/solicitar.tsx:
const { latitud, longitud } = await resolverCoordenadas(ubicacionGps, direccionDestino);

await client.post('/trabajos', {
  servicioId,
  descripcion,
  direccionDestino,
  latitudDestino: latitud,
  longitudDestino: longitud,
});
-----------------------------------------------------------------------------