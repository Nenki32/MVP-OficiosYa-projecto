# ROADMAP — OficiosYa (Marketplace de servicios del hogar)

> **Estado al día:** versión en curso **[COMPLETAR, ej. 0.0.6]** · última revisión **[COMPLETAR fecha]**.
> La convención de ramas está en CONVENCIONES.md y la seguridad en SEGURIDAD.md.

**Estrategia de producto (secuencial):**
1. **Fase actual (mobile-first):** terminar al 100 % el diseño y funcionamiento de la app en Expo (`mobile/`). Mientras tanto, `frontend/` solo es banco de pruebas técnico.
2. **Fase siguiente (plataforma web):** con la app cerrada, construir la web de producción (Bloque 8).

---

## 1. Objetivos 2026 (el norte del producto)

### Producto
- Ser el lugar más confiable para contratar un oficio en el barrio: más seguro que Facebook Marketplace o MercadoLibre porque la confianza es verificable (matrícula validada + reseñas solo de trabajos con doble confirmación).
- Cubrir los dos modos reales del hogar: urgencia (gas, destapación, cerrajería) y programado (reforma, pintura, instalación).
- El cliente no paga nunca; el ingreso viene de la suscripción del profesional.

### Arquitectura
- Una sola fuente de verdad: las reglas de negocio se calculan en la API, nunca duplicadas en mobile ni web (como ya se hace con `faltantes` del perfil).
- Reducir dependencias frágiles: pasar de Expo Go a development build y no depender de que el plan gratuito de Supabase esté activo para operar.
- Tests y CI sobre los invariantes críticos antes de tener usuarios reales.

### Lanzamiento
- Lanzar por barrio, no por ciudad: densidad de profesionales antes que alcance.

### Principios (para decidir lo que no está escrito)
- Ante la duda, la privacidad del cliente gana: mostrar menos datos, no más.
- Confianza verificable antes que crecimiento: no se habilita un rubro regulado sin verificación, aunque eso frene altas.
- Simple primero: una funcionalidad terminada vale más que tres a medias.

---

## 2. Decisiones abiertas

Nada de esta lista se implementa sin decisión explícita (regla Karpathy #1).

- [ ] **Versión para la postulación desde la app y la triangulación** (Bloqueo #1 y la variante abierta del hallazgo 1 de SEGURIDAD.md): no figuran en la tabla de versiones. Sugerencia: la versión en curso. La revelación por etapas y el filtro de postulaciones ya están en el código.
- [ ] **Carpeta de la web de producción:** el Bloque 8 dice `frontend/`; la versión 1.0.0 mencionaba `SiteWeb/`. Unificar.
- [ ] **Empresas:** ¿entidad propia con profesionales asociados, o tipo de perfil dentro de Usuarios? Afecta asignación y reputación (¿la reseña es de la empresa o del operario que fue?).
- [ ] **Sesión:** refresh tokens propios + lista de revocación, o migrar a Supabase Auth (login con Google, recuperación de contraseña, OTP por SMS).
- [ ] **Datos tras completar el trabajo:** revocar la dirección exacta o conservarla durante la ventana de disputa y luego anonimizar.

---

## 3. Plan de versiones (acordado 2026-09-29)

No se hace un PR por cambio: cada versión es un PR a master que sube `version` en `mobile/app.json` y lleva su tag git (ej. `v0.0.6`). La app todavía no está en beta, por eso la numeración va en 0.0.x. El flujo de ramas está en CONVENCIONES.md.

| Versión | Contenido |
|---|---|
| 0.0.5 | Base: lo mergeado hasta el PR #14 (tag sobre master). |
| 0.0.6 | Peticiones del cliente: Mis peticiones, autocompletar dirección y fecha en el detalle (rama `feature/mis-peticiones-meqlvj`). |
| 0.0.7 | Matrículas: rubros regulados, estado de verificación, bloqueo de ofertas sin verificar, revisión manual y el 500 al registrar un premium sin matrícula. |
| 0.0.8 | Perfil y avisos: foto de perfil (con restricción de archivos, EXIF eliminado y políticas RLS de Storage, SEGURIDAD.md §3 controles 3, 4 y 16), campana de notificaciones del profesional y editar una petición pendiente. |
| 0.0.9 | Disponibilidad y turnos: tareas con duración, horario laboral y franjas sin solapamiento (Bloque 4). |
| 0.0.10 | Suscripciones: planes, "Mi suscripción" y baja de CuentaCorriente, Deudor y la comisión del 15 %. |
| 0.0.11 | Cierre del trabajo: código de 4 dígitos que el cliente da al profesional (generado en el backend con `RandomNumberGenerator`, comparado en tiempo constante y con límite de intentos; SEGURIDAD.md §4); sin código, 72 h para reclamar antes de completarse solo. Reclamo con motivos y foto opcional que revisa un admin (no afecta la reputación mientras tanto). Reseña solo con trabajo completado, réplica pública del profesional y ficha con matrícula y reseñas arriba. |
| 0.0.12 | Seguridad: rate limiting, refresh tokens (aleatorios y guardados hasheados), concurrencia al aceptar, validación de montos y CORS, y cerrar en ✅ todos los controles del checklist de SEGURIDAD.md §3 que apliquen a la app. |
| 0.0.13 | Tiempo real y push (Bloque 5; requiere development build, Expo Go no soporta push ni mapas). |
| 0.0.14 | Calidad y diseño: cobertura amplia de tests, paginación, CI, pulido visual y **refactor de estilos**: mover `mobile/src/theme.ts` a `mobile/src/styles/theme.ts` y sacar los `StyleSheet.create` de las 15 pantallas existentes a `styles/pantallas/` (CONVENCIONES.md §5). |
| 0.0.15 | Reprogramación negociada con motivos y reputación. |
| 0.1.0 | Beta: la app cerrada, para probar con usuarios reales. |
| 1.0.0 | Lanzamiento, con la web de producción (Bloque 8). |

**Regla de tests por versión:** cada versión que toca un invariante (privacidad, pagos, verificación de matrículas) incluye su test en la misma versión. La 0.0.14 suma cobertura amplia y CI, pero no es la primera vez que se testea.

---

## 4. Estado actual del proyecto

### 4.1 Arreglar primero (detectado probando el 2026-08-11)

- [ ] **1. El profesional no puede presupuestar desde la app.** La lista no es tocable: no hay detalle ni acción. Es el mayor bloqueo funcional. El backend ya soporta `POST /api/trabajos/{id}/postularse`. Al verificarlo, comprobar que el filtrado por rubro no lo esté ocultando.
- [ ] **2. "Ubicación no especificada" confunde cuando sí hay dirección.** Solución elegida: geocodificar la dirección escrita con `Location.geocodeAsync` de expo-location (geocodificador del sistema, sin claves).
- [ ] **3. El cliente no puede editar una petición publicada.** Permitir editar mientras esté en "pendiente" (si ya hay profesional asignado, avisarle del cambio). *Versión 0.0.8.*
- [ ] **4. La franja de "trabajos sin fecha" de la agenda no tiene acción.** Debe poder tocarse para abrir el trabajo y asignarle fecha.

### 4.2 Ya completado (2026-08-09 a 2026-08-11)

**Infraestructura y base de datos**
- [x] Clean Architecture en .NET 9 (toolchain .NET 9.0.316, Node 22.16), EF Core 9.
- [x] Proyecto Supabase en São Paulo (PostgreSQL 17.6) con extensiones postgis y btree_gist.
- [x] Proveedor EF migrado a Npgsql.EntityFrameworkCore.PostgreSQL + NetTopologySuite con `EnableRetryOnFailure(3)`.
- [x] Esquema bajo EF Migrations (InitialCreate y siguientes), catálogo de 10 servicios sembrado y usuarios de prueba recreados.
- [x] RLS habilitado en las 9 tablas de `public` (migración HabilitarRls): ENABLE sin FORCE, sin políticas. La API conecta con el rol postgres (BYPASSRLS); los roles anon y authenticated de PostgREST no ven ninguna fila.

**Perfil profesional**
- [x] Usuarios sumó: `tipo_perfil` (persona/empresa, ortogonal al rol), `razon_social`, `cuit`, `descripcion`, `ubicacion` (geography(Point, 4326) + índice GiST), `radio_cobertura_km` y `disponible`.
- [x] Endpoints en `/api/profesionales/me/`: perfil (GET/PUT), ubicacion (PUT), servicios (PUT).
- [x] El perfil devuelve `faltantes`, calculado en el servidor para que app y web no se contradigan.
- [x] App: `app/profesional/{editar,rubros,zona}.tsx` y el tab de perfil como centro del onboarding.

**Geolocalización**
- [x] `Trabajos.latitud_destino/longitud_destino` migrados a `ubicacion geography(Point, 4326)` con traspaso de datos.
- [x] El cliente publica capturando GPS (`app/solicitar.tsx`).
- [x] La lista del profesional filtra por rubros y radio, calcula distancia con PostGIS (`ST_DWithin` + `ST_Distance`) y ordena por cercanía.
- [x] `TrabajoDto.distanciaKm` visible en la tarjeta.

**App mobile (Expo SDK 54)**
- [x] Funciona en dispositivo real (Moto E32 vía Expo Go) contra el backend en LAN y Supabase.
- [x] expo-router, tabs según rol, token en SecureStore, sistema de diseño en `src/theme.ts`, alta de petición, listado y cierre de sesión.

### 4.3 Reglas de negocio implementadas (no reabrir)

- Los trabajos propios del profesional se ven siempre, sin importar rubro ni radio: si movió su zona después de tomarlo, no desaparece.
- Un trabajo sin coordenadas se muestra a todos los profesionales con la leyenda "Ubicación no especificada" (para que el cliente que niega el permiso no publique en el vacío).
- Si el profesional no cargó ubicación o radio, no se filtra por cercanía (mejor mostrar todo que una lista vacía sin explicación).
- Radios ofrecidos: 5, 10, 15 y 20 km. La base admite 1–200 como cota de cordura; la restricción a esos valores es decisión de producto.
- No se muestran coordenadas crudas: se usa geocodificación inversa del sistema operativo (barrio y ciudad), con texto genérico si falla.

### 4.4 Pendientes técnicos conocidos

- `Trabajos.latitud_inicio/longitud_inicio` siguen siendo numeric sueltos (punto de partida del profesional; hoy nadie los lee).
- El selector persona/empresa no tiene pantalla (el modelo lo soporta; se dejó fuera a propósito).
- Separar estado en Usuarios si quedan rastros de estado de sesión en la base (la sesión es JWT stateless).
- Validación de DTOs: DataAnnotations en `CompletarTrabajoRequest` y requests de montos para impedir negativos.
- CORS por entorno (`Program.cs:109`): `AllowAnyOrigin` solo en Development.
- Sesión fantasma en la web (`useAuth.tsx:15`): inicializa desde localStorage sin validar contra `GET /api/auth/me` ni limpiar ante un 401.
- Higiene de arquitectura: sacar `AppDbContext` de `TrabajosController` y la dependencia de Core → Delivery.DTOs.
- **Migración a la carpeta `styles/`:** agendada en 0.0.14. Hasta entonces, solo las pantallas nuevas usan `styles/`.
- "Tu perfil está completo" hoy solo valida rubros, ubicación y radio, no identidad ni matrícula (induce a error; se corrige en 0.0.7).

---

## 5. Cambio de reglas de negocio: suscripción al profesional (2026-08-10)

El producto pasó de cobrar comisión por trabajo a cobrar suscripción al profesional. Esto invalida código que hoy funciona. Leer antes de tocar cualquier cosa relacionada con pagos.

### Modelo nuevo (el cliente no paga nunca)
- **Suscripción mensual/anual:** acceso a los trabajos publicados y envío de presupuestos, ilimitados o según plan.
- **Comisión por contacto (lead):** en ciertos planes, importe fijo por establecer contacto directo con un cliente.

### Obsoleto (eliminar o reemplazar, nunca reparar)
- CuentaCorriente (ledger de deudas).
- `Pagos.comision` y el 15 % en `CompletarAsync` (`TrabajoUseCase:134-190`).
- `EstadoUsuario.Deudor` y `PagarDeudaAsync` (se reemplazan por estado de suscripción).
- `CuentaCorrienteUseCase` y sus endpoints.
- Pantalla "Mi saldo" (web/mobile) → "Mi suscripción".
- Bloque 4.5 completo (cobros por comisión e híbrido MP): descartado.

> El ledger append-only está bien construido y sirve para registrar movimientos de suscripción. Se aprovecha la estructura; cambia el significado de cada asiento.

### A construir
- [ ] Suscripciones: plan, precio, vigencia (desde/hasta), estado, medio de pago.
- [ ] Planes: nombre, precio mensual/anual, límite de presupuestos, si incluye rubros regulados.
- [ ] Bloqueo de envío de presupuestos con suscripción vencida.
- [ ] Cobro recurrente (Mercado Pago admite suscripciones).
- [ ] Migración: dar de baja CuentaCorriente sin perder el historial.

### Cambios en el flujo del trabajo
- [ ] El cliente publica con presupuesto estimado y plazo: Trabajos necesita `presupuesto_estimado` y `plazo_deseado`.
- [ ] Ubicación aproximada al publicar, exacta recién al asignar (ver SEGURIDAD.md, hallazgo 1).
- [ ] Doble confirmación de trabajo terminado: estado `pendiente_confirmacion` entre `en_progreso` y `completado`; campos `confirmado_cliente` y `confirmado_profesional`; `completado` solo con ambas.
- [ ] La reseña se habilita recién con la doble confirmación (`UQ_Resenias_trabajo`): 1–5 estrellas + comentario.

### Verificación de matrículas (requisito, no mejora)
- [ ] Marcar qué rubros son regulados en el catálogo de Servicios.
- [ ] Estado de verificación por profesional: pendiente / verificado / rechazado.
- [ ] Bloquear presupuestos en rubros regulados sin verificación.
- [ ] Circuito de revisión (manual al principio).

### GPS en lugar de coordenadas precargadas
- [ ] Pedir permiso de ubicación explicando para qué se usa.
- [ ] Si se niega, degradar con elegancia: geocodificar la dirección escrita o mostrar aviso claro.
- [ ] Sin tabla de localidades precargadas: la ubicación sale del dispositivo.

---

## 6. Diseño de los bloques mobile y backend (3.4 a 7)

### Bloques 3.4 y 3.5 — Scoring y concurrencia
- Ranking más allá de la distancia:
  `score = w1*(1/distancia) + w2*rating_promedio + w3*(premium?) + w4*tasa_aceptacion - w5*(suscripcion_vencida?)`
- Concurrencia al aceptar: `UPDATE ... WHERE estado='pendiente'` condicional o token `xmin` de Postgres (hoy dos profesionales simultáneos pasan ambos la validación).

### Bloque 4 — Agenda, turnos y notificaciones
Dos modos: **urgencia** (gas, destapación, cerrajería → proximidad, tracking y "lo antes posible") y **programado** (reforma, pintura, instalación → turno y recordatorio).

**4.0 El cliente elige la franja (estilo OSDE)**
- Tabla Tareas (debajo de Servicios): `servicio_id`, `nombre`, `duracion_estimada_min`, `precio_referencia` (ej. Plomero → Cambiar flexible 60 min, Destapar cañería 90 min, Reparar termotanque 120 min, Reinstalación completa a presupuestar).
- `ProfesionalTareas` permite sobrescribir duración y precio por profesional; las franjas libres usan la duración del profesional.
- Tarea con duración conocida → turno con franja; trabajo a presupuestar → postulación.

**4.1 Modelo de agenda**
- Turnos: `trabajo_id`, `profesional_id`, `franja` (tstzrange), `estado`.
- Nuevo estado `agendado` entre `aceptado` y `viajando`.
- `DisponibilidadProfesional`: horario laboral por día de la semana.
- `GET /profesionales/{id}/disponibilidad?desde&hasta`.
- Hold temporal del slot (~10 min) mientras el cliente reserva.
- Sin horario cargado, degradar al flujo de postulaciones.

**4.1.b Anti-solapamiento en Postgres (requiere btree_gist)**
```sql
ALTER TABLE turnos ADD CONSTRAINT sin_solapamiento
  EXCLUDE USING gist (profesional_id WITH =, franja WITH &&)
  WHERE (estado <> 'cancelado');
```

**4.2.b Calendario del profesional** (requiere `fecha_visita` en Trabajos)
- Pestaña Agenda en la barra inferior del profesional.
- Vista de hoy como entrada, mensual con marcas (evaluar react-native-calendars alineado con `styles/theme.ts`), lista del día por hora, aviso de solapamientos y franja tocable de trabajos sin agendar.

**4.2 Calendarios externos**
- MVP: archivo .ics / "Agregar al calendario" (sin OAuth; Google, Apple, Outlook).
- Después: OAuth con Google Calendar (`calendar.events` es scope sensible y exige verificación de Google; fuera del camino crítico del lanzamiento).

**4.3 Notificaciones y privacidad legal**
- MVP: push con Expo Notifications (confirmación de turno, recordatorio, profesional en camino).
- Después: WhatsApp Business Platform (Meta Cloud API / Twilio / 360dialog): plantillas aprobadas, pago por conversación utility, cuenta verificada y ventana de 24 h.
- Refresh tokens de Google y mensajes a teléfonos implican datos personales bajo la Ley 25.326. Revisar antes de producción.

### Bloque 5 — Tiempo real
- [ ] Tracking del profesional en viaje vía Supabase Realtime (cambios de `ultima_ubicacion`, sin polling).
- [ ] Push cuando aparece un trabajo en el radio del profesional.
- [ ] Estados del trabajo en vivo sin refrescar.

### Bloque 6 — Cierre de la app mobile
- [ ] Detalle del trabajo interactivo (postularse, cambiar estado, confirmar finalización).
- [ ] Ficha del profesional: matrícula y reseñas verificadas arriba de todo.
- [ ] Mi suscripción (reemplaza a Mi saldo).
- [ ] Development build con EAS (Expo Go no alcanza para react-native-maps ni push).
- [ ] Mapa de cercanía y decisión sobre Supabase Auth (ver Decisiones abiertas).

### Bloque 7 — Calidad y CI antes de producción
- [ ] Tests de los casos de uso críticos: postulación, asignación, doble confirmación y suscripciones (ver TESTING.md).
- [ ] Paginación en todos los listados.
- [ ] Postulaciones con estado (pendiente/aceptada/rechazada) para notificar a los no elegidos.
- [ ] CI en GitHub Actions (`.github/workflows`) con `dotnet test` y Dependabot.

### El diferenciador en el modelo de datos (decisiones firmes)
- Matching híbrido: búsqueda directa donde hay densidad de profesionales; postulaciones como red de contención donde no hay nadie cerca. Implica lanzar por barrio.
- Lo que Facebook Marketplace o MercadoLibre no pueden ofrecer:
  1. `nivel_profesional = premium` + `numero_matricula` → credencial verificable (un gasista matriculado es una categoría legal).
  2. `UQ_Resenias_trabajo` → una reseña solo existe si hubo un trabajo completado con doble confirmación.
- Comparables: Thumbtack y Angi (EE.UU.), Habitissimo (España), IguanaFix (Argentina).

---

## 7. Bloque 8 — Plataforma web de producción (`frontend/`)

> **Condición de entrada:** solo se inicia cuando el diseño, la lógica y el funcionamiento de la app mobile (Bloques 1 a 7) estén finalizados y validados, para construir la web una sola vez sobre contratos de API definitivos.

### 8.1 Arquitectura web
- [ ] **Tipos compartidos:** interfaces TypeScript de Trabajos, Usuarios, Postulaciones, Turnos y Suscripciones sincronizadas con `mobile/`.
- [ ] **Cliente HTTP centralizado (`client.ts`):** inyección automática de credenciales; manejo global de 401 (rotar con refresh token y, si falla, limpiar sesión y redirigir a /login); eliminar la sesión fantasma de `useAuth.tsx:15` validando contra `GET /api/auth/me` al montar.
- [ ] **Estado de servidor y caché** con revalidación (TanStack Query) para listados, postulaciones y agenda.
- [ ] **Code splitting y rutas protegidas por rol:** bundles separados para vistas públicas, Cliente, Profesional/Empresa y Admin, con `ProtectedRoute` que verifica rol y estado de suscripción.
- [ ] **SEO y performance:** metaetiquetas dinámicas (título, descripción, OpenGraph) para que perfiles y búsquedas por oficio/barrio se previsualicen bien en WhatsApp y buscadores; variables de entorno tipadas (`VITE_API_URL`), sin URLs ni IPs hardcodeadas.

### 8.2 Diseño (UI/UX)
- [ ] **Sistema de diseño unificado:** todo el diseño en `frontend/src/styles/` (CONVENCIONES.md §5). Los tokens de `mobile/src/styles/theme.ts` se traducen a variables en `styles/tokens.css`, y cada componente usa su CSS Module en `styles/componentes/`.
- [ ] **Responsive según el uso:** mobile-web first para clientes (pedir presupuesto o ver una ficha desde un link sin la app); desktop para Profesionales, Empresas y Admin (tablas densas, calendario a pantalla completa, operarios, comprobantes).
- [ ] **Jerarquía de confianza:** sello de matrícula verificada (ENARGAS / ente regulador), número de credencial y reseñas con doble confirmación arriba del pliegue.
- [ ] **Feedback y accesibilidad (WCAG AA):** skeletons en vez de pantallas en blanco o saltos de layout; estados vacíos accionables ("No hay plomeros disponibles en este horario → Publicar solicitud"); navegación por teclado, foco visible, ARIA en formularios y contraste legible.

### 8.3 Seguridad web
- [ ] **Sesión segura:** nada de JWT de larga duración en localStorage; cookies HttpOnly + Secure + SameSite=Strict, o access token corto en memoria + refresh token en cookie HttpOnly.
- [ ] **CORS estricto:** `CORS_ORIGINS` solo con el dominio oficial (`AllowAnyOrigin` prohibido fuera de Development).
- [ ] **Security headers:** Content-Security-Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS bajo HTTPS obligatorio.
- [ ] **Prevención de XSS:** escapar descripciones, comentarios, razones sociales y reseñas; nunca `dangerouslySetInnerHTML`.
- [ ] **Privacidad por etapas en web:** ninguna respuesta visible en DevTools → Network expone dirección exacta, coordenadas sin redondear ni teléfonos en trabajos no asignados; aviso de privacidad acorde a la Ley 25.326.

### 8.4 Funcionalidad web
- [ ] **Landing pública (sin login):** buscador por rubro y barrio con precios y duraciones de referencia de Tareas; perfiles públicos compartibles de profesionales verificados (URL limpia para WhatsApp); CTA para descargar la app o registrarse.
- [ ] **Portal del cliente:** alta y edición de solicitudes (presupuesto estimado, plazo, autocompletado/geocodificación o GPS del navegador); comparador de presupuestos y reserva de franja con hold de 10 min; doble confirmación y reseña verificada.
- [ ] **Portal del profesional y empresa:** Mi Suscripción (plan, vigencia, historial de pagos, checkout de Mercado Pago Suscripciones); carga de DNI y matrícula para rubros regulados; agenda web (diaria, semanal, mensual, sin fecha, exportación .ics); gestión de empresa (operarios, rubros, `ProfesionalTareas`, radio en mapa).
- [ ] **Backoffice de administración:** bandeja de validación de matrículas; ABM de Servicios (marcando regulados), Tareas y Planes; auditoría de trabajos, usuarios y resolución de disputas.
