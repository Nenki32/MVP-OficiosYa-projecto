# ROADMAP — OficiosYa (Marketplace de servicios del hogar)

> Última actualización consolidada: Cambio a modelo de suscripción, estado real en Supabase (São Paulo) + Expo SDK 54, directrices de seguridad y Plan de Plataforma Web.
> Estrategia de Producto (Secuencial):
> 1. Fase Actual (Mobile-First): Finalizar al 100 % el diseño y funcionamiento de la App Mobile en Expo (mobile/). Mientras dure esta etapa, frontend/ solo actúa como banco de pruebas técnico.
> 2. Fase Siguiente (Plataforma Web): Una vez cerrado el diseño y flujo de la App Mobile, construir y diseñar la Página Web de producción (ver Bloque 8 al final de este documento).

=============================================================================
1. CAMBIO DE REGLAS DE NEGOCIO: SUSCRIPCIÓN AL PROFESIONAL (2026-08-10)
=============================================================================

El producto pasó de cobrar comisión por trabajo a cobrar suscripción al profesional.
Esto invalida código que hoy funciona. Leer esta sección antes de tocar nada relacionado con pagos.

MODELO NUEVO (El cliente no paga nunca):
Los ingresos salen exclusivamente del lado profesional:
- Suscripción mensual/anual: Acceso a los trabajos publicados y envío de presupuestos, ilimitados o según plan.
- Comisión por contacto (lead): En ciertos planes, importe fijo por establecer contacto directo con un cliente.

QUÉ QUEDA OBSOLETO (Es código escrito que ahora está mal — A eliminar/reemplazar):
- CuentaCorriente (ledger de deudas): Sin sentido, no hay comisión por trabajo.
- Pagos.comision y el 15 % en CompletarAsync (TrabajoUseCase:134-190): A eliminar.
- EstadoUsuario.Deudor y PagarDeudaAsync: Sin sentido; se reemplaza por estado de suscripción.
- CuentaCorrienteUseCase y sus endpoints: A reemplazar.
- Pantalla "Mi saldo" (web/mobile): A reemplazar por "Mi suscripción".
- Bloque 4.5 completo (modelo de cobros por comisión e híbrido MP): Descartado.
> Ironía útil: El ledger append-only está bien construido y sirve igual para registrar movimientos de suscripción. La estructura se aprovecha; lo que cambia es qué significa cada asiento.

QUÉ HAY QUE CONSTRUIR EN EL NUEVO MODELO:
- [ ] Suscripciones: plan, precio, vigencia (desde/hasta), estado, medio de pago.
- [ ] Planes: nombre, precio mensual/anual, límite de presupuestos, si incluye rubros regulados.
- [ ] Bloqueo de envío de presupuestos si la suscripción está vencida.
- [ ] Integración de cobro recurrente (Mercado Pago admite suscripciones).
- [ ] Migración: dar de baja CuentaCorriente sin perder el historial.

CAMBIOS EN EL FLUJO DEL TRABAJO:
- [ ] El cliente publica con presupuesto estimado y plazo: Trabajos necesita presupuesto_estimado y plazo_deseado (hoy no existen).
- [ ] Ubicación aproximada al publicar, exacta recién al asignar (ver sección de revelación por etapas).
- [ ] Doble confirmación de trabajo terminado:
      * Nuevo estado pendiente_confirmacion entre en_progreso y completado.
      * Campos confirmado_cliente y confirmado_profesional.
      * Estado completado solo cuando ambos confirmaron.
- [ ] La reseña se habilita recién con la doble confirmación (UQ_Resenias_trabajo): No se puede reseñar un trabajo que no ocurrió. Puntuación 1–5 estrellas + comentario sobre cómo resolvió.

EMPRESAS, NO SOLO PERSONAS:
El modelo menciona "perfil de la empresa" además del perfil del profesional. Hoy Usuarios solo contempla personas físicas en la UI.
- [ ] Decidir: ¿Empresas como entidad propia con profesionales asociados, o un tipo de perfil dentro de Usuarios?
- [ ] Definir impacto: Una empresa con varios operarios cambia el modelo de asignación y de reputación (¿la reseña es de la empresa o del operario que fue?).

VERIFICACIÓN DE MATRÍCULAS — AHORA ES REQUISITO, NO MEJORA:
Con el modelo nuevo pasa a ser un factor central del producto: la plataforma verifica credenciales ANTES de permitir ofertar en rubros regulados.
- [ ] Marcar qué rubros son regulados en el catálogo de Servicios.
- [ ] Estado de verificación por profesional: pendiente / verificado / rechazado.
- [ ] Bloquear el envío de presupuestos en rubros regulados sin verificación.
- [ ] Circuito de revisión (manual al principio).

GPS EN LUGAR DE COORDENADAS PRECARGADAS:
- [ ] Pedir permiso de ubicación en la app, con explicación de para qué se usa.
- [ ] Si el usuario lo niega, degradar con elegancia: geocodificar la dirección ingresada a mano o mostrar aviso claro.
- [ ] No hace falta una tabla de localidades con coordenadas precargadas: la ubicación sale del dispositivo, simplificando el modelo de datos.

=============================================================================
2. CONVENCIÓN DE RAMAS (Acordada 2026-08-11)
=============================================================================

"Una rama, una cosa." Es la regla de la que se desprende todo lo demás.
- Funcionalidad nueva: Rama feature/<nombre> desde master.
- Otra funcionalidad distinta: OTRA rama feature/, no seguir en la anterior.
- Corregir algo de una funcionalidad: fix/ de esa misma funcionalidad, para que no se contradigan.
- Solo documentación: docs/<tema>.

No apilar trabajo no relacionado en una rama abierta (mezclar temas hace que el PR sea imposible de revisar de a partes, no se pueda revertir una funcionalidad sin arrastrar otras y ensucie el historial).

Ciclo obligatorio:
  git checkout master ; git pull
  git checkout -b feature/lo-que-sea
  # trabajar, commitear
  git push -u origin feature/lo-que-sea
  # PR -> master, mergear, borrar la rama

> Ejemplo de lo que NO hay que hacer (precedente): la rama feature/perfil-profesional terminó cargando el perfil profesional, la geolocalización, RLS y los calendarios — cuatro temas distintos en siete commits. Deberían haber sido cuatro ramas.

=============================================================================
2.b PLAN DE VERSIONES Y FLUJO DE RAMAS (Acordado 2026-09-29)
=============================================================================

No se hace un PR por cambio: cada versión es un PR a master que sube "version" en mobile/app.json y lleva su tag git (ej. v0.0.6).
La app todavía no está en beta, por eso la numeración va en 0.0.x.

Flujo por versión (una sola rama activa por vez, para probar en vivo en Expo Go sin cortar):
1. feature/vX.Y.Z sale desde master y junta todos los commits de feature de la versión. Se prueba con git pull (Expo Go recarga solo; la API se reinicia solo si cambió el backend).
2. Probadas las features, sale fix/vX.Y.Z DESDE la feature con los arreglos. Si hace falta, bug/vX.Y.Z sale del fix.
3. Probados los arreglos, se suben a la rama feature (no van directo a master).
4. El PR a master sale de la rama feature con todo: version en mobile/app.json + tag.
Piden reiniciar Metro/Expo o la API: cambios en app.json, paquetes nativos nuevos y migraciones de base.

| Versión | Contenido |
|---------|-----------|
| 0.0.5   | Base: lo mergeado hasta el PR #14 (tag sobre master). |
| 0.0.6   | Peticiones del cliente: Mis peticiones, autocompletar dirección y fecha en el detalle (rama feature/mis-peticiones-meqlvj). |
| 0.0.7   | Matrículas: rubros regulados, estado de verificación, bloqueo de ofertas sin verificar, revisión manual y el 500 al registrar un premium sin matrícula. |
| 0.0.8   | Perfil y avisos: foto de perfil, campana de notificaciones del profesional y editar una petición pendiente. |
| 0.0.9   | Disponibilidad y turnos: tareas con duración, horario laboral y franjas sin solapamiento (Bloque 4). |
| 0.0.10  | Suscripciones: planes, "Mi suscripción" y baja de CuentaCorriente, Deudor y la comisión del 15 %. |
| 0.0.11  | Cierre del trabajo: código de 4 dígitos que el cliente da al profesional; sin código, 72 h para reclamar antes de completarse solo. Reclamo con motivos y foto opcional que revisa un admin (no afecta la reputación mientras tanto). Reseña solo con trabajo completado, réplica pública del profesional y ficha con matrícula y reseñas arriba. |
| 0.0.12  | Seguridad: rate limiting, refresh tokens, concurrencia al aceptar, validación de montos y CORS. |
| 0.0.13  | Tiempo real y push (Bloque 5; requiere development build, Expo Go no soporta push ni mapas). |
| 0.0.14  | Calidad y diseño: tests, paginación, CI y pulido visual. |
| 0.0.15  | Reprogramación negociada con motivos y reputación. |
| 0.1.0   | Beta: la app cerrada, para probar con usuarios reales. |
| 1.0.0   | Lanzamiento, con la web de producción en SiteWeb/ (Bloque 8). |

=============================================================================
3. DÓNDE ESTÁ EL PROYECTO HOY Y QUÉ YA SE COMPLETÓ (2026-08-09 a 2026-08-11)
=============================================================================

INFRAESTRUCTURA Y BASE DE DATOS (SUPABASE + .NET 9):
- [x] Estructura Clean Architecture en .NET 9 (Toolchain .NET 9.0.316, Node 22.16), EF Core 9.
- [x] Proyecto Supabase activo en South America (São Paulo, PostgreSQL 17.6) con extensiones postgis y btree_gist creadas.
- [x] Proveedor EF migrado a Npgsql.EntityFrameworkCore.PostgreSQL + NetTopologySuite con EnableRetryOnFailure(3).
- [x] Esquema bajo EF Migrations (InitialCreate y siguientes), catálogo de 10 servicios sembrado y usuarios de prueba recreados (todos reciben token JWT).
- [x] RLS habilitado en las 9 tablas del esquema public (migración HabilitarRls): activo con ENABLE y sin FORCE, sin políticas. La API .NET no se ve afectada porque conecta con el rol postgres (dueño con BYPASSRLS); los roles anon y authenticated de PostgREST quedan bloqueados y no ven ninguna fila.

PERFIL PROFESIONAL (BACKEND + APP):
- [x] Usuarios sumó: tipo_perfil (persona/empresa, ortogonal al rol), razon_social, cuit, descripcion, ubicacion (geography(Point, 4326) + índice GiST), radio_cobertura_km y disponible.
- [x] Endpoints en /api/profesionales/me/: perfil (GET/PUT), ubicacion (PUT), servicios (PUT).
- [x] El perfil devuelve faltantes: lista de textos con lo que falta completar, calculada en el servidor para que app y web no se contradigan.
- [x] App: app/profesional/{editar,rubros,zona}.tsx y el tab de perfil como centro del onboarding.

GEOLOCALIZACIÓN OPERATIVA:
- [x] Trabajos.latitud_destino/longitud_destino migrados a ubicacion geography(Point, 4326), con traspaso de datos en la migración.
- [x] El cliente publica capturando GPS (app/solicitar.tsx).
- [x] La lista del profesional filtra por sus rubros y su radio, calcula distancia con PostGIS (ST_DWithin + ST_Distance) y ordena de más cerca a más lejos.
- [x] TrabajoDto.distanciaKm visible en la tarjeta.

APP MOBILE (EXPO SDK 54):
- [x] Proyecto Expo SDK 54 en mobile/ funcionando en dispositivo real (Moto E32 vía Expo Go) contra el backend en LAN (0.0.0.0:5100) y Supabase.
- [x] Navegación con expo-router, tabs según rol, token en SecureStore (Keychain/Keystore, no en texto plano), sistema de diseño centralizado en src/theme.ts, alta de petición, listado y cierre de sesión.

REGLAS DE NEGOCIO IMPLEMENTADAS (PARA NO REABRIRLAS):
- Los trabajos propios del profesional se ven siempre, sin importar rubro ni radio: si tomó un trabajo y después movió su zona, no desaparece de su lista.
- Un trabajo sin coordenadas se muestra a todos los profesionales con la leyenda "Ubicación no especificada" (evita que un cliente que niega el permiso de ubicación publique en el vacío sin enterarse).
- Si el profesional no cargó ubicación o radio, no se filtra por cercanía (mejor mostrar todo que una lista vacía sin explicación).
- Radios ofrecidos: 5, 10, 15 y 20 km. La base admite 1–200 como cota de cordura; la restricción a esos cuatro valores es decisión de producto.
- No se muestran coordenadas crudas en pantalla: se usa geocodificación inversa del sistema operativo para mostrar barrio y ciudad, con respaldo a un texto genérico si falla.

PARA LEVANTAR TODO EN LOCAL:
  # Terminal 1 — backend (0.0.0.0 para que lo alcance el celular)
  dotnet run --project Marketplace.Api --urls http://0.0.0.0:5100

  # Terminal 2 — app (siempre dentro de mobile/)
  cd mobile; npx expo start

Usuarios de prueba existentes (contraseña: Test1234!):
- admin@oficiosya.com (Administrador)
- juan@test.com (Juan Perez — cliente)
- maria@test.com (Maria Garcia — cliente)
- carlos@test.com (Carlos Lopez — profesional standard)
- pedro@test.com (Pedro Martinez — profesional premium)

TRAMPAS TÉCNICAS QUE YA COSTARON TIEMPO:
- Cambiar mobile/app.json no se propaga con una recarga: hay que reiniciar Metro y cerrar Expo Go por completo desde recientes (por eso se implementa la detección automática de IP LAN con expo-constants en client.ts).
- mobile/.npmrc tiene legacy-peer-deps=true: sin eso expo install falla.
- Nunca correr comandos de Expo con el directorio de trabajo en frontend/: instala expo donde no corresponde y reformatea tsconfig.json.
- PowerShell no acepta &&; usar ;.
- DotNetEnv rompe si hay comillas dobles dentro del valor en .env: la connection string va con comillas simples envolviendo todo el valor y la password sin comillas.
- En Supabase Plan Gratuito los proyectos se pausan tras inactividad prolongada: se reactivan desde el dashboard sin perder datos.

=============================================================================
4. DETECTADO PROBANDO EL 2026-08-11 — ARREGLAR PRIMERO
=============================================================================

[ ] 1. El profesional no puede aceptar/presupuestar un trabajo desde la app:
    - Se creó una petición y el profesional no pudo tomarla. La lista no es tocable: no hay detalle ni acción. Es el mayor bloqueo funcional.
    - El backend ya soporta POST /api/trabajos/{id}/postularse.
    - Al verificarlo, comprobar además si el filtrado por rubro no lo está ocultando (si el rubro del trabajo no está entre los del profesional, no aparece).

[ ] 2. "Ubicación no especificada" confunde cuando sí hay dirección:
    - La etiqueta se muestra cuando el trabajo no tiene coordenadas, pero el cliente pudo haber escrito la dirección igual.
    - Solución elegida: Geocodificar la dirección escrita usando Location.geocodeAsync de expo-location (usa el geocodificador del sistema, sin claves) para que tenga coordenadas aunque no se otorgue el permiso de GPS.

[ ] 3. El cliente no puede editar una petición publicada:
    - Si se equivocó en la dirección, la fecha o la descripción, hoy solo puede cancelar y volver a publicar.
    - Permitir editar mientras esté en estado "pendiente" (con un profesional ya asignado habría que avisarle del cambio).

[ ] 4. La franja de "trabajos sin fecha" de la agenda no tiene acción:
    - Es solo texto. Debería poder tocarse para abrir el trabajo y asignarle una fecha.

LO QUE SIGUE, EN ORDEN SUGERIDO (reemplazado por el plan de versiones de la sección 2.b):
1. Detalle del trabajo y envío de presupuesto desde la app (POST /api/trabajos/{id}/postularse) + Revelación por etapas de direcciones (Seguridad #1).
2. Verificación de matrículas (marcar qué rubros son regulados, estado de verificación por profesional, bloqueo de oferta sin verificar y circuito de revisión manual inicial). Ojo: el mensaje "Tu perfil está completo" hoy solo valida rubros, ubicación y radio, no identidad ni matrícula (induce a error).
3. Foto de perfil (usando Supabase Storage).
4. Icono de notificaciones en el inicio del profesional (el del cliente ya lo tiene).
5. Calendario del profesional (ver 4.2.b) y disponibilidad horaria (Bloque 4).
6. Suscripciones, que reemplazan al modelo de comisiones descartado + limpieza de código obsoleto de CuentaCorriente.
7. Una vez cerrados los puntos anteriores y validado el diseño/flujo completo en la App Mobile, iniciar el Bloque 8 (Construcción y Rediseño de la Página Web).

PENDIENTES TÉCNICOS Y DE ARQUITECTURA CONOCIDOS:
- Trabajos.latitud_inicio/longitud_inicio siguen siendo numeric sueltos (punto de partida del profesional al viajar; hoy nadie los lee).
- El selector persona/empresa no tiene pantalla (el modelo lo soporta pero se dejó fuera a propósito).
- Separar estado en Usuarios si aún quedan rastros del estado de sesión en DB (la sesión es JWT stateless).
- Validación de DTOs: DataAnnotations en CompletarTrabajoRequest y requests de montos para impedir valores negativos.
- CORS por entorno (Program.cs:109): AllowAnyOrigin solo en Development.
- Sesión fantasma en el frontend web (useAuth.tsx:15): inicializa desde localStorage sin validar contra GET /api/auth/me ni limpiar localStorage ante un 401 en client.ts.
- Higiene de arquitectura: sacar AppDbContext de TrabajosController y sacar la dependencia de Core -> Delivery.DTOs.

=============================================================================
5. SEGURIDAD — ESTADO Y PRIORIDADES (Verificado en código)
=============================================================================

⛔ NO CORRER "npm audit fix --force" EN mobile/:
Se evaluó y rompe el proyecto: intenta subir expo a 57.0.12 (no soportado por Expo Go de las tiendas) y bajar react-native de 0.81.5 a 0.72.17, dejando paquetes internos mezclados.
Para actualizar dentro de lo que el SDK permite: npx expo install --fix.

HALLAZGOS EN CÓDIGO PROPIO (Atacar en orden antes de tener usuarios reales):

🔴 ALTO — Explotable hoy:
1. Fuga de direcciones de clientes:
   - GetByProfesionalAsync (Marketplace.Api/Infrastructure/Data/Repositories/TrabajoRepository.cs:42) devuelve todos los trabajos sin asignar, y TrabajoDto incluye direccionDestino más las coordenadas exactas.
   - Ataque: registrarse como profesional con un DNI inventado -> GET /api/trabajos -> dirección exacta de todos los clientes del sistema. Los usuarios son personas en su casa esperando a un desconocido; es el hallazgo más grave del proyecto.
   - Solución diseñada (Revelación por etapas):
     * Antes de asignarse: Barrio + distancia aproximada + coordenada redondeada (~2 a 3 decimales). Dos DTOs o sanitización en TrabajoPublicoDto (difuso) vs TrabajoAsignadoDto (exacto). Misma lógica para el teléfono del cliente.
     * Turno confirmado: Dirección exacta solo para el profesional asignado.
     * Trabajo completado: Revocado o conservado por ventana de disputa y luego anonimizado.

2. DNI y matrícula sin verificar:
   - Los campos dni y numero_matricula existen pero nada los valida. Cualquiera se declara "premium matriculado".
   - Mínimo: revisión manual en el alta. Ideal: validar contra el registro correspondiente (gasistas -> ENARGAS; electricistas varía por jurisdicción).

3. Credenciales débiles y registro sin límites:
   - Los usuarios de prueba usan Test1234!. El registro público (/api/auth/register/...) no tiene límite de intentos (Rate Limiting) ni verificación de email. Revisar y aplicar Rate Limiting antes de exponer la API.

🟠 MEDIO:
4. Código residual de cobros (PagarDeudaAsync y CuentaCorriente):
   - PagarDeudaAsync limpiaba deuda sin pago real detrás. Con el cambio al modelo de suscripción, eliminar directamente esos endpoints y casos de uso obsoletos para no dejar superficie expuesta.

5. Postulaciones visibles entre competidores:
   - TrabajoDetalleDto.Postulaciones va completo a cualquiera que consulte el trabajo: un profesional ve los presupuestos de los demás y puede ofertar apenas por debajo.
   - Solución: El profesional debe recibir solo la suya (más un booleano yaMePostule); el cliente recibe la lista completa.

6. Token de 24 h sin renovación ni revocación:
   - Un token robado vale un día completo y no hay forma de invalidarlo, y en mobile pedir login a diario es motivo de desinstalación. Implementar Refresh Tokens y lista de revocación (o migrar a Supabase Auth).

🟢 BAJO — Vulnerabilidades de npm (19 reportadas, 3 causas raíz):
- image-size 1.2.1 (alta: DoS parseando ICNS/JXL/HEIF), postcss 8.4.49 (alta: lectura vía sourceMappingURL), uuid 7.0.3 (media: límites de buffer).
- El riesgo real es bajo porque los tres corren solo en la cadena de compilación local (Metro, CSS, generación Xcode) y ninguno viaja en el bundle al teléfono.
- Higiene pendiente: activar Dependabot en GitHub y npm audit en CI para detectar vulnerabilidades nuevas.

=============================================================================
6. DISEÑO DETALLADO DE LOS BLOQUES MOBILE Y BACKEND (3.4 a 7)
=============================================================================

BLOQUE 3.4 y 3.5 — SCORING Y CONCURRENCIA:
- Ranking sugerido más allá de la distancia:
  score = w1*(1/distancia) + w2*rating_promedio + w3*(premium?) + w4*tasa_aceptacion - w5*(suscripcion_vencida?)
- Concurrencia al aceptar trabajo: Aceptar con UPDATE ... WHERE estado='pendiente' condicional o token de concurrencia xmin de Postgres (hoy dos profesionales simultáneos pasan ambos la validación).

BLOQUE 4 — AGENDA, TURNOS Y NOTIFICACIONES:
El producto tiene dos modos: urgencia (gas, destapación, cerrajería -> proximidad, tracking y opción "lo antes posible") y programado (reforma, pintura, instalación -> turno y recordatorio).
- 4.0 El cliente elige la franja (estilo OSDE):
  * Nueva tabla Tareas (debajo de Servicios): servicio_id, nombre, duracion_estimada_min, precio_referencia (ej. Plomero -> Cambiar flexible 60 min, Destapar cañería 90 min, Reparar termotanque 120 min, Reinstalación completa a presupuestar). Da transparencia de precios.
  * Duración configurable: Tareas.duracion_estimada_min es por defecto; cada profesional puede sobrescribirlo en ProfesionalTareas (duracion_min y precio propios). El cálculo de franjas libres usa la duración del profesional.
  * Línea divisoria: tarea con duración conocida -> turno con franja; trabajo a presupuestar (reforma/obra) -> postulación.
- 4.1 Modelo de agenda:
  * Turnos: trabajo_id, profesional_id, franja (tstzrange), estado.
  * Nuevo estado agendado entre aceptado y viajando.
  * DisponibilidadProfesional: horario laboral por día de la semana.
  * Endpoint de slots libres: GET /profesionales/{id}/disponibilidad?desde&hasta.
  * Hold temporal del slot (~10 min) mientras el cliente completa la reserva.
  * Si el profesional no cargó horario, degradar con elegancia al flujo de postulaciones.
- 4.1.b Anti-solapamiento a nivel motor en Postgres (requiere btree_gist):
  ALTER TABLE turnos ADD CONSTRAINT sin_solapamiento
    EXCLUDE USING gist (profesional_id WITH =, franja WITH &&)
    WHERE (estado <> 'cancelado');
- 4.2.b Calendario del profesional en la app (requiere agregar fecha_visita en Trabajos):
  * Nueva pestaña Agenda en la barra inferior del profesional.
  * Vista de "hoy" como entrada, vista mensual con marcas (evaluar react-native-calendars alineado con theme.ts), lista del día ordenada por hora, aviso visual de solapamientos y franja superior tocable de trabajos "sin agendar".
- 4.2 Sincronización con calendarios externos:
  * MVP: archivo .ics / link "Agregar al calendario" (cero OAuth, funciona con Google/Apple/Outlook).
  * Después: OAuth 2.0 con Google Calendar (ojo: calendar.events es un scope sensible que exige verificación de seguridad de Google al escalar; no poner en el camino crítico del lanzamiento).
- 4.3 Notificaciones y Privacidad Legal:
  * MVP: push con Expo Notifications (gratis, instantáneo). Cubre confirmación de turno, recordatorio previo y profesional en camino.
  * Después: WhatsApp Business Platform (Cloud API de Meta / Twilio / 360dialog). Exige plantillas aprobadas por Meta para iniciar conversación, pago por conversación "utility", cuenta verificada y ventana de 24h.
  * Datos personales: Guardar refresh tokens de Google y mandar mensajes a teléfonos implica tratar datos personales regulados en Argentina por la Ley 25.326. Revisar antes de salir a producción.

BLOQUE 5 — TIEMPO REAL:
- [ ] Tracking del profesional en viaje vía Supabase Realtime (suscripción a cambios de ultima_ubicacion en Usuarios, sin polling).
- [ ] Push cuando aparece un trabajo en el radio del profesional.
- [ ] Estados del trabajo en vivo sin refrescar.

BLOQUE 6 — APP MOBILE CON EXPO (Cierre de la App):
- [ ] Detalle del trabajo interactivo (postularse, cambiar estado, confirmar finalización).
- [ ] Ficha del profesional: matrícula y reseñas verificadas arriba de todo.
- [ ] Mi suscripción (reemplaza a Mi saldo).
- [ ] Development build con EAS (Expo Go no alcanza para react-native-maps ni push notifications).
- [ ] Mapa de cercanía y evaluación de migración a Supabase Auth (login con Google, recuperación de contraseña y OTP por SMS).

BLOQUE 7 — CALIDAD Y CI ANTES DE PRODUCCIÓN:
- [ ] Tests automatizados de los casos de uso críticos (postulación, asignación, doble confirmación y suscripciones).
- [ ] Paginación en todos los listados.
- [ ] Postulaciones con estado (pendiente/aceptada/rechazada) para notificar a los postulantes no elegidos.
- [ ] CI en GitHub Actions (.github/workflows).

EL DIFERENCIADOR EN EL MODELO DE DATOS (DECISIONES FIRMES):
- Flujo de matching híbrido: Búsqueda directa cuando hay densidad de profesionales; postulaciones como red de contención cuando no hay nadie cerca. Implica lanzar por barrio, no por ciudad.
- Lo que Facebook Marketplace o MercadoLibre estructuralmente no pueden ofrecer:
  1. nivel_profesional = premium + numero_matricula -> credencial verificable (un gasista matriculado es una categoría legal).
  2. UQ_Resenias_trabajo -> una reseña solo existe si hubo un trabajo completado con doble confirmación.
- Comparables de mercado para estudiar: Thumbtack y Angi (EE.UU.), Habitissimo (España), IguanaFix (Argentina).

=============================================================================
7. BLOQUE 8 — PLATAFORMA WEB DE PRODUCCIÓN (frontend/)
=============================================================================

> CONDICIÓN DE ENTRADA: Este bloque se inicia ÚNICAMENTE cuando el diseño, la lógica de negocio y el funcionamiento de la App Mobile (Bloques 1 al 7) estén finalizados y validados. Así se diseña y construye la web una sola vez sobre contratos de API definitivos.

Una vez terminada la App Mobile, frontend/ deja de ser un banco de pruebas y se transforma en la Plataforma Web oficial de OficiosYa, cumpliendo obligatoriamente con estos 4 pilares:

-----------------------------------------------------------------------------
8.1 REQUISITOS OBLIGATORIOS DE ARQUITECTURA WEB
-----------------------------------------------------------------------------
- [ ] Contratos y Tipos Compartidos: Sincronizar interfaces TypeScript (DTOs de Trabajos, Usuarios, Postulaciones, Turnos y Suscripciones) con lo ya validado en mobile/ para evitar discrepancias entre clientes.
- [ ] Cliente HTTP Centralizado e Interceptores (client.ts):
      * Inyección automática de credenciales/tokens.
      * Manejo global de respuestas HTTP 401 (intentar rotación con Refresh Token y, si falla, limpiar sesión y redirigir a /login).
      * Eliminación de la "Sesión Fantasma" (useAuth.tsx:15): Validar el estado de sesión real contra GET /api/auth/me al montar la aplicación en lugar de confiar ciegamente en localStorage.
- [ ] Gestión de Estado de Servidor y Caché: Uso de caché con revalidación (ej. TanStack Query / React Query) para listados, postulaciones y agenda, evitando estados locales desincronizados.
- [ ] Code Splitting y Rutas Protegidas por Rol (Lazy Loading): Separar los bundles de vistas públicas, panel de Cliente, portal de Profesional/Empresa y Backoffice de Administrador mediante guardias de ruta (ProtectedRoute) que verifiquen rol y estado de suscripción.
- [ ] SEO Técnico y Performance (Core Web Vitals):
      * Metaetiquetas dinámicas (título, descripción, OpenGraph) para que los links de perfiles profesionales y búsquedas por oficio/barrio previsualicen bien al compartirse por WhatsApp o buscadores.
      * Variables de entorno estrictamente tipadas (VITE_API_URL) sin URLs ni IPs hardcodeadas.

-----------------------------------------------------------------------------
8.2 REQUISITOS OBLIGATORIOS DE DISEÑO (UI/UX)
-----------------------------------------------------------------------------
- [ ] Sistema de Diseño Unificado con Mobile: Trasladar los tokens visuales de mobile/src/theme.ts (paleta de colores, tipografías, radios de borde, badges de estados) a variables CSS / Tailwind para que App y Web se sientan el mismo producto.
- [ ] Diseño Responsive Adaptado al Contexto de Uso:
      * Mobile-Web First para Clientes: Quien entra desde un link en el celular sin tener la app instalada debe poder pedir un presupuesto o ver la ficha de un profesional con la misma fluidez que en la app.
      * Desktop-Optimized para Profesionales, Empresas y Admin: Aprovechar la pantalla grande con tablas densas, vista de calendario semanal/mensual a pantalla completa, administración de operarios y descarga de comprobantes de suscripción.
- [ ] Jerarquía Visual de Confianza (El Diferenciador): En la ficha web del profesional, el sello de Matrícula Verificada (ENARGAS / ente regulador), el número de credencial y las reseñas de trabajos doblemente confirmados deben ubicarse arriba del pliegue (above the fold), nunca escondidos al pie.
- [ ] Feedback Visual y Accesibilidad (WCAG AA):
      * Skeletons de carga en lugar de pantallas en blanco o saltos de layout (CLS).
      * Estados vacíos accionables (ej. "No hay plomeros disponibles en este horario -> Publicar solicitud para recibir presupuestos").
      * Navegación completa por teclado, foco visible, etiquetas ARIA en formularios y contraste legible.

-----------------------------------------------------------------------------
8.3 REQUISITOS OBLIGATORIOS DE SEGURIDAD WEB
-----------------------------------------------------------------------------
- [ ] Almacenamiento Seguro de Sesión (Mitigación de XSS y Robo de Tokens):
      * Reemplazar el guardado de JWT de larga duración en localStorage plano por cookies HttpOnly + Secure + SameSite=Strict (o Access Token de corta vida en memoria RAM + Refresh Token en cookie HttpOnly).
- [ ] Política de CORS Estricta en Backend: Configurar CORS_ORIGINS en Marketplace.Api para que en producción solo acepte peticiones desde el dominio web oficial (prohibido AllowAnyOrigin fuera de Development).
- [ ] Cabeceras de Seguridad HTTP (Security Headers): Configurar en el servidor web / CDN:
      * Content-Security-Policy (CSP) restringiendo orígenes de scripts, estilos y conexiones API.
      * X-Content-Type-Options: nosniff
      * X-Frame-Options: DENY (anti-clickjacking)
      * Referrer-Policy: strict-origin-when-cross-origin
      * Strict-Transport-Security (HSTS) bajo HTTPS obligatorio.
- [ ] Prevención de XSS y Sanitización de Contenido de Usuarios: Escapar y sanitizar descripciones de trabajos, comentarios de presupuestos, razones sociales y reseñas antes de renderizarlos, sin usar nunca inyección de HTML crudo (dangerouslySetInnerHTML).
- [ ] Cumplimiento de Privacidad yRevelación por Etapas en Web:
      * Ningún componente ni respuesta de red en el navegador (DevTools -> Network) debe exponer direccionDestino exacta, coordenadas sin redondear ni teléfonos de clientes en trabajos no asignados.
      * Aviso de privacidad y tratamiento de datos personales acorde a la Ley 25.326 (Argentina).

-----------------------------------------------------------------------------
8.4 REQUISITOS OBLIGATORIOS DE FUNCIONALIDAD WEB
-----------------------------------------------------------------------------
- [ ] 1. Landing Pública y Adquisición (Sin Login):
      * Buscador público por rubro y barrio/zona con precios y duraciones de referencia del catálogo de Tareas ("Cambiar flexible: ~60 min").
      * Perfiles públicos compartibles de profesionales verificados (URL limpia para que el profesional comparta su ficha verificada por WhatsApp).
      * Llamados a la acción (CTA) claros para descargar la App Mobile o registrarse en el momento.
- [ ] 2. Portal del Cliente:
      * Alta y edición de solicitudes de trabajo (con presupuesto estimado, plazo deseado y autocompletado/geocodificación de dirección o GPS del navegador).
      * Comparador de presupuestos recibidos y reserva de turnos por franja horaria (con hold temporal de 10 minutos).
      * Botón de Doble Confirmación de trabajo finalizado y formulario de reseña verificada (1 a 5 estrellas + comentario).
- [ ] 3. Portal del Profesional y Panel de Empresa:
      * Pantalla "Mi Suscripción" (reemplaza a la obsoleta "Mi Saldo"): selección de plan mensual/anual, estado de vigencia, historial de pagos e integración con el checkout de Mercado Pago Suscripciones.
      * Carga de documentación para verificación de identidad (DNI) y matrícula profesional en rubros regulados.
      * Agenda web interactiva (vista diaria, semanal y mensual + trabajos sin fecha asignada + exportación .ics).
      * Gestión de perfil de Empresa: administración de operarios asociados, rubros, precios/duraciones propias (ProfesionalTareas) y radio de cobertura en mapa.
- [ ] 4. Backoffice de Administración (Rol Admin):
      * Bandeja de validación de matrículas y credenciales (aprobar / rechazar profesionales en rubros regulados como Gasista o Electricista).
      * ABM del catálogo de Servicios (marcando cuáles son regulados), Tareas (duración y precio de referencia) y Planes de suscripción.
      * Panel de auditoría de trabajos, usuarios y resolución de disputas.