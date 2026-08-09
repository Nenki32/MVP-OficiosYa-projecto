# ROADMAP — Encoya (Marketplace de servicios del hogar)

> Documento de retomada. Si volvés al proyecto después de un parate, **empezá por el Bloque 0**.
> Última actualización: 2026-08-09

---

## Dónde está el proyecto hoy

**Funciona:** estructura Clean Architecture en .NET 9, EF Core, modelo de dominio completo
(usuarios/servicios/trabajos/postulaciones/pagos/cuenta corriente/reseñas), 7 pantallas React,
flujo de negocio pensado de punta a punta.

**No funciona:** el login no emite token salvo para admin, así que clientes y profesionales
no pueden usar ningún endpoint autenticado. **La app hoy no se puede probar.**

**No existe:** la geolocalización. Están las columnas de lat/lng y el índice, pero ninguna
consulta calcula distancia, el profesional no tiene ubicación ni radio de cobertura, y la
tabla `ProfesionalServicios` (rubros) no tiene endpoints. Es el corazón del producto y está vacío.

---

## Bloque 0 — Reactivación ✅ (verificado 2026-08-09)

- [x] SQL Server Express corriendo (`MSSQL$SQLEXPRESS` — Running)
- [x] `dotnet build` → 0 errores, 0 advertencias
- [x] `npm run build` (frontend) → tsc + vite OK, 253 kB
- [x] API levanta en http://localhost:5100, conecta a la base, swagger 200
- [x] `GET /api/servicios` devuelve el catálogo sembrado (10 rubros)
- [x] `dotnet-ef` instalado (tool global, necesario para el Bloque 2)
- [ ] Loguearte en http://localhost:5173 con el admin del `.env` y ver el dashboard

**El entorno está sano.** Nada se pudrió en el parate. Toolchain: .NET 9.0.316, Node 22.16.
Base vacía de trabajos/usuarios salvo el admin sembrado al arranque.

---

## Bloque 1 — Que la app vuelva a ser usable (~1 día de trabajo)

Objetivo: poder recorrer el flujo completo como cliente y como profesional.

- [ ] **Emitir token para todos los roles** en `AuthUseCase.LoginAsync:77`
      Hoy: `usuario.Rol == "admin" ? token : null`. Es el bloqueador nº1.
- [ ] **Separar `estado`** en dos columnas: `estado_sesion` y `situacion_comercial`
      Hoy el login pisa la marca de "Deudor" en cada ingreso (`AuthUseCase:73` vs `TrabajoUseCase:171`).
      La sesión no debería vivir en la DB: para eso está el JWT stateless.
- [ ] **Transacción en `CompletarAsync`** (`TrabajoUseCase:134-190`)
      Hoy escribe CuentaCorriente y Trabajo/Pago en dos `SaveChanges`. Si falla el segundo
      queda una comisión adeudada sin trabajo completado. Es plata. Fix de 20 minutos.
- [ ] **Precisión decimal en `AppDbContext`** — verificado 2026-08-09, es un bug real.
      No hay ningún `HasPrecision`/`HasColumnType`, así que EF mapea las 4 columnas de
      coordenadas como `decimal(18,2)` (2 decimales) aunque en la base sean `DECIMAL(10,7)`.
      El valor se redondea en el parámetro **antes** de llegar a SQL Server: toda ubicación
      queda pegada a una grilla de ~1 km. Rompe de raíz la búsqueda por proximidad.
      ```csharp
      e.Property(t => t.LatitudDestino).HasPrecision(10, 7);   // ídem Longitud* e *Inicio
      ```
      Las columnas de plata (`monto`, `comision`, `monto_total`, `saldo_posterior`,
      `presupuesto`) están bien en `decimal(18,2)` — declararlas explícitas solo para
      silenciar el warning y que no tape uno real más adelante.
      Sin datos que migrar: `Trabajos` está vacía.
- [ ] **Validación de DTOs** — DataAnnotations en `CompletarTrabajoRequest` como mínimo
      (hoy se acepta `MontoTotal` negativo).
- [ ] **CORS por entorno** (`Program.cs:109`) — `AllowAnyOrigin` solo en Development.
- [ ] **Sesión fantasma en el frontend** — detectado 2026-08-09.
      `useAuth.tsx:15` inicializa el usuario desde `localStorage` y le cree sin validar
      contra el servidor. Una sesión de hace 2 meses sigue mostrándose como activa con el
      backend apagado. No es un agujero de seguridad (la API valida el JWT igual), pero la
      UI miente sobre el estado de sesión. Necesita:
      - Restaurar un endpoint de validación (`GET /api/auth/me`, eliminado en `5182bf0`)
        y llamarlo al montar la app.
      - Manejar 401 en `client.ts`: limpiar `localStorage` y redirigir al login.
      Hoy, combinado con el bug del token, el resultado es una cáscara logueada que
      devuelve 401 en cada llamada y nunca te saca de ahí.

### Usuarios de prueba existentes (de `seed_test_users.ps1`, 2026-06-25)

| id | email | nombre | rol |
|----|-------|--------|-----|
| 1  | admin@encoya.com | Administrador | admin |
| 9  | juan@test.com | Juan Perez | cliente |
| 10 | maria@test.com | Maria Garcia | cliente |
| 11 | carlos@test.com | Carlos Lopez | profesional standard |
| 12 | pedro@test.com | Pedro Martinez | profesional premium |
- [ ] Recorrer a mano: registrar cliente → crear trabajo → registrar profesional →
      postularse → asignar → estados → completar → reseña. Anotar lo que se rompa.

> **Nota deliberada:** la race condition al aceptar un trabajo (`TrabajoUseCase:99`) NO va acá.
> Se arregla en el Bloque 3, después de migrar a Postgres, porque `rowversion` es de SQL Server
> y en Postgres se resuelve distinto (`xmin`). Hacerlo ahora es escribirlo dos veces.

---

## Bloque 2 — Supabase (~2 días)

Objetivo: Postgres + PostGIS andando, con el backend .NET apuntando ahí.

### 2.1 Crear la cuenta (esto lo hacés vos, yo no puedo)

1. Entrar a https://supabase.com → **Start your project**
2. Registrarte **con GitHub** (ya tenés cuenta, es lo más rápido)
3. **New project**:
   - Name: `encoya-mvp`
   - Region: **South America (São Paulo)** — es la más cercana a Argentina, menos latencia
   - Database password: generá una fuerte y **guardala en tu gestor de contraseñas ahora mismo**.
     Supabase no te la muestra de nuevo y la vas a necesitar para la connection string.
4. Esperar ~2 minutos a que aprovisione.

> ⚠️ **Importante para vos específicamente:** en el plan gratuito los proyectos se pausan
> tras un período de inactividad. Si volvés a desaparecer 2 meses, vas a encontrar el proyecto
> pausado — se reactiva desde el dashboard, no se pierden los datos, pero que no te agarre
> de sorpresa.

### 2.2 Preparar la base

- [ ] SQL Editor → habilitar PostGIS:
      ```sql
      create extension if not exists postgis;
      ```
- [ ] Project Settings → Database → Connection string → **usar el "Session pooler"** (puerto 5432).
      No uses el *Transaction pooler* (6543) con EF Core: rompe los prepared statements de Npgsql.
      La conexión directa (`db.<ref>.supabase.co`) es IPv6, puede no resolverte desde casa.
- [ ] Guardar la cadena en `Marketplace.Api/.env` como `DB_CONNECTION` (el `.env` ya está en `.gitignore` ✓)

### 2.3 Migrar el backend

- [ ] Quitar `Microsoft.EntityFrameworkCore.SqlServer`, agregar:
      - `Npgsql.EntityFrameworkCore.PostgreSQL` (9.x)
      - `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` (para PostGIS)
- [ ] `Program.cs`: `UseSqlServer(...)` → `UseNpgsql(..., o => o.UseNetTopologySuite())`
- [ ] **Pasar a EF Migrations** y descartar los `.sql` a mano de `database/`:
      ```
      dotnet ef migrations add InitialCreate
      dotnet ef database update
      ```
      Esto es lo que te faltaba para tener el esquema versionado y reproducible.
- [ ] Revisar tipos: `DATETIME2` → `timestamptz`, `NVARCHAR` → `text`, `TINYINT` → `smallint`
- [ ] Re-seedear el catálogo de servicios y volver a correr el flujo del Bloque 1

### 2.4 Auth: qué hacer (y qué NO hacer todavía)

**Quedate con tu JWT propio por ahora.** Ya está escrito y funciona.
Migrar a Supabase Auth en el mismo bloque que la base de datos son dos cambios riesgosos
al mismo tiempo. Se migra en el Bloque 5 (mobile), que es cuando realmente lo vas a necesitar:
recuperación de contraseña, login con Google y OTP por SMS te los da gratis, y ahí vas a estar
tocando el flujo de auth de todos modos.

---

## Bloque 3 — Geolocalización: el corazón del producto (~1 semana)

Objetivo: que un cliente vea plomeros cerca suyo, ordenados por cercanía.

### 3.1 Datos que faltan

- [ ] Agregar a `Usuarios`:
      ```
      ubicacion_base   geography(Point, 4326)   -- PostGIS
      radio_cobertura_km  int
      disponible       boolean
      ultima_ubicacion geography(Point, 4326)   -- tracking en vivo
      ultima_ubicacion_en timestamptz
      ```
- [ ] Índice GiST sobre `ubicacion_base` (sin esto la búsqueda por radio hace scan completo)
- [ ] Migrar `Trabajos.latitud_destino/longitud_destino` → `geography(Point, 4326)`

### 3.2 Rubros (hoy la tabla existe pero está muerta)

- [ ] `GET /api/profesionales/me/servicios` — ver mis rubros
- [ ] `PUT /api/profesionales/me/servicios` — declarar en qué rubros trabajo
- [ ] Pantalla de onboarding del profesional para cargarlos

Sin esto solo podés buscar "alguien cerca", no "un plomero cerca".

### 3.3 Búsqueda por proximidad

- [ ] `GET /api/profesionales/cerca?lat=&lng=&servicioId=&radioKm=`
      Con NetTopologySuite en EF Core esto se traduce solo a `ST_DWithin` + `ST_Distance`:
      ```csharp
      _db.Usuarios
         .Where(u => u.Rol == "profesional" && u.Disponible)
         .Where(u => u.Servicios.Any(s => s.ServicioId == servicioId))
         .Where(u => u.UbicacionBase.IsWithinDistance(punto, radioMetros))
         .OrderBy(u => u.UbicacionBase.Distance(punto))
      ```
- [ ] `GET /api/trabajos/cerca` — la vista inversa, para el profesional
      (reemplaza a `GetPendientesAsync()`, que hoy trae **todos** los pendientes del país)

### 3.3.b Revelación por etapas de datos sensibles (hacer JUNTO con la búsqueda)

**Riesgo actual, verificado en el código:** `GetByProfesionalAsync`
([TrabajoRepository.cs:42](Marketplace.Api/Infrastructure/Data/Repositories/TrabajoRepository.cs:42))
devuelve todos los trabajos sin asignar, y `TrabajoDto` incluye `direccionDestino`
más las coordenadas exactas. El registro de profesionales es abierto y el DNI no se
valida. Ataque concreto: registrarse como profesional con un DNI inventado, pegarle
a `GET /api/trabajos` y llevarse la dirección exacta de todos los clientes.

Los usuarios son personas solas en su casa esperando a un desconocido. Esto importa.

| Momento | Qué ve el profesional |
|---|---|
| Antes de asignarse | Barrio + distancia aproximada. Coordenada redondeada (~3 decimales ≈ 100 m) |
| Turno confirmado | Dirección exacta — **solo el profesional asignado** |
| Trabajo completado | Revocado (o conservado por ventana de disputa, luego anonimizado) |

- [ ] Dos DTOs distintos: `TrabajoPublicoDto` (difuso) y `TrabajoAsignadoDto` (exacto)
- [ ] Misma lógica para el teléfono del cliente
- [ ] **Verificación de identidad**: hoy `dni` y `numero_matricula` no se validan contra
      nada — cualquiera se declara "premium matriculado". Es el agujero central de una
      app cuyo diferencial es la confianza. Mínimo: revisión manual en el alta.
      Ideal: validar matrícula contra el registro (gasistas → ENARGAS; electricistas
      varía por jurisdicción).

> Barato ahora, caro después: retrofitear privacidad con direcciones reales ya
> cargadas es mucho más doloroso.

### 3.4 Scoring

La distancia sola no alcanza. Ranking sugerido:

```
score = w1·(1/distancia) + w2·rating_promedio + w3·(premium?) + w4·tasa_aceptacion − w5·(deudor?)
```

Arrancá con pesos fijos en configuración; se afinan con datos reales.

### 3.5 Arreglar concurrencia (ahora sí)

- [ ] Aceptar trabajo con `UPDATE ... WHERE estado='pendiente'` condicional o token de
      concurrencia `xmin`. Hoy dos profesionales simultáneos pasan los dos la validación,
      y en una app de proximidad donde todos ven el mismo trabajo esto pasa seguido.

---

## Bloque 4 — Agenda y turnos (~1.5 semanas)

> Subido de prioridad sobre el tracking en vivo. El producto tiene **dos modos**:
> *urgencia* (gas, destapación, cerrajería → proximidad y tracking) y *programado*
> (reforma, pintura, instalación → turno y recordatorio). En servicios del hogar el
> modo programado es la mayor parte del volumen, y la agenda es lo que retiene
> profesionales: un plomero cambia de app por una que le organiza los turnos, no
> por un mapa que se mueve.

### 4.0 Modelo elegido: el cliente elige la franja (estilo OSDE)

El cliente ve un calendario con las franjas libres del profesional, elige una, y esa
franja queda ocupada. No el profesional proponiendo horario.

**Consecuencia:** el sistema tiene que saber cuánto dura el trabajo **antes** de que el
profesional lo vea. Y hoy el catálogo llega solo hasta `Servicios` ("Plomero"), que
abarca desde cambiar un flexible (1 h) hasta rehacer una cañería (3 días). No se le
puede asignar una duración.

- [ ] **Nueva tabla `Tareas`** (un nivel debajo de `Servicios`):
      `servicio_id`, `nombre`, `duracion_estimada_min`, `precio_referencia`
      ```
      Plomero → Cambiar flexible (60), Destapar cañería (90),
                Reparar termotanque (120), Reinstalación completa (a presupuestar)
      ```
      Beneficio extra: **transparencia de precios**, algo que Facebook Marketplace
      no puede dar. "Cambiar un flexible: ~$X, 1 hora."

- [ ] **Duración: el catálogo propone, el profesional dispone.** `Tareas.duracion_estimada_min`
      es el valor por defecto; cada profesional puede sobrescribirlo para sí mismo
      (tabla `ProfesionalTareas` con `duracion_min` y `precio` propios). Un tipo en moto
      por Capital no tarda lo mismo que uno en camioneta por zona sur.
      **Implicación:** el cálculo de franjas libres usa la duración *del profesional*,
      no la del catálogo. La consulta de disponibilidad es por profesional **y** por tarea.

- [ ] **Línea divisoria entre los dos modos:**
      tarea con duración conocida → **turno con franja**;
      trabajo a presupuestar (reforma, obra) → **postulación** (el flujo que ya existe).

### 4.1 Modelo de agenda (hoy no existe ni un campo de fecha)

- [ ] `Turnos`: `trabajo_id`, `profesional_id`, `franja` (**tstzrange**), `estado`
- [ ] Nuevo estado `agendado` entre `aceptado` y `viajando`
- [ ] `DisponibilidadProfesional`: horario laboral por día de la semana
- [ ] Endpoint de slots libres: `GET /profesionales/{id}/disponibilidad?desde&hasta`
- [ ] **Hold temporal del slot** mientras el cliente completa la reserva (~10 min y se
      libera). Sin esto: o perdés la franja a mitad del formulario, o las reservas
      abandonadas bloquean franjas para siempre.
- [ ] Opción "lo antes posible" para urgencias reales (pérdida de gas): que no obligue
      a elegir franja, sino que busque al primer profesional disponible.

### 4.1.b Anti-solapamiento a nivel de base (solo Postgres)

Dos clientes eligiendo las 16:00 del mismo profesional en el mismo instante pasan
ambos la validación en C#. Validar en la aplicación **no alcanza**. Postgres lo
resuelve en el motor — SQL Server no puede hacerlo nativamente:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE turnos ADD CONSTRAINT sin_solapamiento
  EXCLUDE USING gist (
    profesional_id WITH =,
    franja         WITH &&
  ) WHERE (estado <> 'cancelado');
```

Con esto es imposible que existan dos turnos superpuestos del mismo profesional.
Es un argumento más para la migración del Bloque 2.

> **Dependencia de arranque:** para que el cliente vea franjas, el profesional tiene
> que haber cargado su horario. Eso es onboarding obligatorio del profesional, y si
> nadie lo carga el calendario aparece vacío — el mismo problema de arranque que el
> mapa vacío. Va con la misma solución: caer al flujo de postulaciones.

### 4.2 Calendario

- [ ] **MVP: archivo `.ics` / link "Agregar al calendario".** Cero OAuth, cero
      verificación de Google, funciona con Google/Apple/Outlook. Es de ida nomás
      (si se reprograma no se actualiza solo), pero para el MVP el intercambio conviene.
- [ ] **Después: OAuth 2.0 con Google Calendar** para sincronización real.
      Ojo: `calendar.events` es un scope sensible — pasando cierta cantidad de usuarios
      Google exige verificación de la app con revisión de seguridad. Lento y puede costar.
      No lo pongas en el camino crítico del lanzamiento.

### 4.3 Notificaciones

- [ ] **MVP: push con Expo Notifications** (gratis, instantáneo). Cubre confirmación
      de turno y recordatorio previo a la visita.
- [ ] **Después: WhatsApp Business Platform** (Cloud API de Meta, directo o vía
      Twilio/360dialog). Es el canal correcto para Argentina, pero tiene fricción real:
      - Los mensajes iniciados por el negocio requieren **plantillas aprobadas por Meta**
        (no se puede mandar texto libre para abrir conversación)
      - **Se paga por mensaje/conversación**; los recordatorios caen en categoría
        "utility". Los precios de Meta cambian seguido: verificar los vigentes.
      - Requiere cuenta de Meta Business verificada y número dedicado
      - Ventana de 24h: si el usuario escribe primero, se puede responder libre por 24h
- [ ] Avisos: confirmación de turno (ambos), recordatorio previo (ambos),
      profesional en camino (cliente)

> **Datos personales:** guardar refresh tokens de Google y mandar mensajes a
> teléfonos implica tratar datos personales. En Argentina aplica la Ley 25.326.
> Revisar antes de salir a producción, no después.

## Bloque 5 — Tiempo real (~3 días)

- [ ] Tracking del profesional en viaje vía **Supabase Realtime** (el cliente se suscribe
      a los cambios de `ultima_ubicacion`, sin polling)
- [ ] Push cuando aparece un trabajo en tu radio
- [ ] Estados del trabajo en vivo (sin refrescar)

---

## Bloque 6 — App mobile con Expo (~3-4 semanas)

**Sin Android Studio, todo desde VS Code:**

```bash
npx create-expo-app@latest encoya-mobile
```

- Probás en tu celular con **Expo Go** escaneando un QR — no necesitás emulador
- Compilás el APK/IPA en la nube con **EAS Build**
- Reusás TypeScript y la capa de servicios del web

Stack: Expo Router (navegación), `react-native-maps` (mapa),
Expo Notifications (push), Supabase JS client (realtime + auth).

Diseño tipo OSDE: bottom tabs, mapa con pins de profesionales, cards de resultado,
detalle con foto/rating/rubros, tracking en vivo.

- [ ] Migrar auth a Supabase Auth acá (ver 2.4)

---

## Bloque 7 — Antes de mostrárselo a alguien real

- [ ] Tests de los use cases que tocan plata (`CompletarAsync`, cuenta corriente)
- [ ] Paginación en todos los listados
- [ ] Postulaciones con estado (`pendiente`/`aceptada`/`rechazada`) — hoy al asignar uno,
      los otros postulantes nunca se enteran
- [ ] Refresh tokens (hoy la sesión se corta de golpe a las 24h)
- [ ] Sacar `AppDbContext` de `TrabajosController` (rompe la arquitectura que armaste)
- [ ] Sacar la dependencia de `Core` → `Delivery.DTOs` (invierte la dependencia)
- [ ] CI en GitHub Actions (`.github/` está vacío)

---

## Decisiones pendientes

| Tema | Opciones | Recomendación |
|---|---|---|
| Rol de Supabase | BaaS completo / solo Postgres / híbrido | **Híbrido**: Supabase da Postgres+PostGIS+Realtime+Auth, .NET se queda con la lógica de plata |
| Auth | Propia / Supabase Auth | Propia ahora, Supabase Auth en el Bloque 6 (mobile) |

### Decidido

- **Flujo de matching: los dos modos.** Búsqueda directa cuando hay densidad de
  profesionales; postulaciones como red de contención cuando no hay nadie cerca.
  No son dos productos: es el mismo degradando con elegancia ante el problema de
  arranque de todo marketplace (un mapa vacío espanta al usuario y no vuelve).
  Implica lanzar por barrio, no por ciudad.
- **La web es banco de pruebas, no entregable.** Sirve para validar arquitectura y
  funcionalidad. El producto real es la app mobile. Cero inversión en diseño visual
  sobre la web: ese trabajo se hace una sola vez, en Expo (Bloque 6).
- **Refresh tokens suben al Bloque 2.** El token de 24h alcanza para web pero es
  inaceptable en mobile: pedir login a diario es motivo de desinstalación.

### El diferenciador ya está en el modelo de datos

Lo que Facebook Marketplace o MercadoLibre **estructuralmente no pueden ofrecer**:

- `nivel_profesional = premium` + `numero_matricula` → credencial verificable.
  Un gasista matriculado es una categoría legal, no una autopercepción.
- `UQ_Resenias_trabajo` → una reseña **solo existe si hubo un trabajo completado**.
  Es prueba de una transacción real, no texto libre falsificable.

Esa es la capa de confianza, y es el producto: cuando alguien deja entrar a un
desconocido a tocar una instalación de gas, el problema no es encontrarlo, es saber
si no le va a arruinar la casa. **Consecuencia de diseño: la matrícula y las reseñas
verificadas van arriba de todo en la ficha del profesional, no al pie.**

Comparables que conviene estudiar (existen, y sus fracasos son aprendizaje gratis):
Thumbtack y Angi (EE.UU.), Habitissimo (España), IguanaFix (Argentina).
