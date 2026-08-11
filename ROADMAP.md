# ROADMAP — OficiosYa (Marketplace de servicios del hogar)

## ⚠️ Cambio de reglas de negocio (2026-08-10)

El producto pasó de **cobrar comisión por trabajo** a **cobrar suscripción al
profesional**. Esto invalida código que hoy funciona. Leer esta sección antes de
tocar nada relacionado con pagos.

### Modelo nuevo

**El cliente no paga nunca.** Los ingresos salen del lado profesional:

| Vía | Cómo funciona |
|---|---|
| **Suscripción mensual/anual** | Acceso a los trabajos publicados y envío de presupuestos, ilimitados o según plan |
| **Comisión por contacto (lead)** | En ciertos planes, importe fijo por establecer contacto directo con un cliente |

### Qué queda obsoleto

Esto **no es trabajo pendiente: es código escrito que ahora está mal.**

| Elemento | Estado |
|---|---|
| `CuentaCorriente` (ledger de deudas) | Sin sentido: no hay comisión por trabajo |
| `Pagos.comision` y el 15 % en `CompletarAsync` | A eliminar |
| `EstadoUsuario.Deudor` | Sin sentido; se reemplaza por estado de suscripción |
| `CuentaCorrienteUseCase` y sus endpoints | A reemplazar |
| Pantalla "Mi saldo" (web) | A reemplazar por "Mi suscripción" |
| **Bloque 4.5 completo** (modelo de cobros) | **Descartado.** Se rediseña |

> Ironía útil: el ledger append-only está bien construido y sirve igual para
> registrar movimientos de suscripción. La estructura se aprovecha; lo que
> cambia es qué significa cada asiento.

### Qué hay que construir

- [ ] **`Suscripciones`**: plan, precio, vigencia (desde/hasta), estado, medio de pago
- [ ] **`Planes`**: nombre, precio mensual/anual, límite de presupuestos, si incluye rubros regulados
- [ ] Bloqueo de envío de presupuestos si la suscripción está vencida
- [ ] Integración de cobro recurrente (Mercado Pago admite suscripciones)
- [ ] Migración: dar de baja `CuentaCorriente` sin perder el historial

### Cambios en el flujo del trabajo

- [ ] **El cliente publica con presupuesto estimado y plazo.** `Trabajos` necesita
      `presupuesto_estimado` y `plazo_deseado`. Hoy no existen.
- [ ] **Ubicación aproximada al publicar**, exacta recién al asignar
      (ya diseñado en la sección de revelación por etapas).
- [ ] **Doble confirmación de trabajo terminado.** Hoy el profesional marca
      "completado" y listo. Ahora hacen falta dos confirmaciones:
      - Nuevo estado `pendiente_confirmacion` entre `en_progreso` y `completado`
      - Campos `confirmado_cliente` y `confirmado_profesional`
      - `completado` solo cuando ambos confirmaron
- [ ] **La reseña se habilita recién con la doble confirmación.** Es lo que hace
      que las reseñas sean confiables: no se puede reseñar un trabajo que no
      ocurrió. Puntuación 1–5 estrellas + comentario sobre cómo resolvió.

### Empresas, no solo personas

El modelo menciona **"perfil de la empresa"** además del perfil del profesional.
Hoy `Usuarios` solo contempla personas físicas.

- [ ] Decidir: ¿`Empresas` como entidad propia con profesionales asociados, o
      un tipo de perfil dentro de `Usuarios`?
- [ ] Una empresa con varios operarios cambia el modelo de asignación y de
      reputación (¿la reseña es de la empresa o del operario que fue?)

### Verificación de matrículas — ahora es requisito, no mejora

Antes figuraba como hallazgo de seguridad. Con el modelo nuevo pasa a ser un
**factor central del producto**: la plataforma verifica credenciales **antes**
de permitir ofertar en rubros regulados.

- [ ] Marcar qué rubros son regulados en el catálogo de `Servicios`
- [ ] Estado de verificación por profesional: pendiente / verificado / rechazado
- [ ] Bloquear el envío de presupuestos en rubros regulados sin verificación
- [ ] Circuito de revisión (manual al principio)

### GPS en lugar de coordenadas precargadas

- [ ] Pedir permiso de ubicación en la app, con explicación de para qué se usa
- [ ] **Si el usuario lo niega, la búsqueda por cercanía no funciona** — hay que
      degradar con elegancia: permitir ingresar la zona a mano o mostrar el aviso
- [ ] **No hace falta una tabla de localidades con coordenadas precargadas.**
      La ubicación sale del dispositivo. Simplifica el modelo de datos.

---

## ROADMAP original

> Documento de retomada. Si volvés al proyecto después de un parate, **empezá por el Bloque 0**.
> Última actualización: 2026-08-09

---

## Dónde retomar (última sesión: 2026-08-11)

> Estado para retomar en otro chat o por otro agente. Lo de abajo, fechado
> 2026-08-09, quedó desactualizado en varias partes.

### Rama activa

`feature/perfil-profesional` — sale de `master` tras el merge del PR #8.

### Qué se completó en esta sesión

**Perfil profesional (backend + app).** Antes un profesional era solo un usuario
con `rol='profesional'`: no declaraba oficios ni zona.

- `Usuarios` sumó `tipo_perfil` (persona/empresa, **ortogonal al rol**),
  `razon_social`, `cuit`, `descripcion`, `ubicacion` (geography 4326 + GiST),
  `radio_cobertura_km` y `disponible`.
- Endpoints en `/api/profesionales/me/`: `perfil` (GET/PUT), `ubicacion` (PUT),
  `servicios` (PUT).
- El perfil devuelve `faltantes`: lista de textos con lo que falta completar.
  Se calcula en el servidor para que app y web no se contradigan.
- App: `app/profesional/{editar,rubros,zona}.tsx` y el tab de perfil como
  centro del onboarding.

**Geolocalización operativa.**
- `Trabajos.latitud_destino/longitud_destino` → `ubicacion` geography, con
  traspaso de datos en la migración.
- El cliente publica capturando GPS (`app/solicitar.tsx`).
- La lista del profesional filtra por **sus rubros** y **su radio**, calcula
  distancia con PostGIS y ordena de más cerca a más lejos.
- `TrabajoDto.distanciaKm`, visible en la tarjeta.

**Seguridad.** RLS habilitado en las 9 tablas (ver sección de seguridad).

### Reglas de negocio implementadas, para no reabrirlas

- **Los trabajos propios del profesional se ven siempre**, sin importar rubro ni
  radio: si tomó un trabajo y después movió su zona, sería absurdo que
  desaparezca de su lista.
- **Un trabajo sin coordenadas se muestra a todos los profesionales**, con la
  leyenda "Ubicación no especificada". Si se filtrara, un cliente que niega el
  permiso de ubicación publicaría en el vacío sin enterarse.
- **Si el profesional no cargó ubicación o radio, no se filtra por cercanía.**
  Mejor mostrar todo que una lista vacía sin explicación.
- **Radios ofrecidos: 5, 10, 15 y 20 km.** La base admite 1–200 como cota de
  cordura; la restricción a esos cuatro valores es decisión de producto.
- **No se muestran coordenadas crudas en pantalla.** Se usa geocodificación
  inversa del sistema operativo para mostrar barrio y ciudad, con respaldo
  a un texto genérico si falla.

### Lo que sigue, en orden sugerido

1. **Detalle del trabajo y envío de presupuesto desde la app.** Hoy la lista del
   profesional **no es tocable**: no puede abrir un trabajo ni presupuestar.
   Es el mayor bloqueo funcional. El backend ya lo soporta
   (`POST /api/trabajos/{id}/postularse`).
2. **Verificación de matrículas.** Hoy cualquiera se marca como Gasista sin
   credencial, y gasista es un oficio regulado. Es el diferenciador declarado
   del producto y no existe. Implica: marcar qué rubros son regulados, estado de
   verificación por profesional, bloqueo de oferta sin verificar, y circuito de
   revisión (manual al principio).
   **Ojo:** el mensaje "Tu perfil está completo" solo valida rubros, ubicación y
   radio. No valida identidad ni matrícula. El texto induce a error.
3. **Foto de perfil.** Necesita almacenamiento; Supabase Storage encaja.
4. **Icono de notificaciones** en el inicio del profesional (el del cliente ya
   lo tiene).
5. **Agenda y disponibilidad horaria** (Bloque 4): sin esto el profesional no
   puede organizarse y se le pasan los pendientes.
6. **Suscripciones**, que reemplazan al modelo de comisiones descartado.

### Pendientes técnicos conocidos

- `Trabajos.latitud_inicio/longitud_inicio` siguen siendo `numeric` sueltos. Se
  usan para el punto de partida del profesional al viajar y hoy nadie los lee.
- El selector persona/empresa **no tiene pantalla**: el modelo lo soporta pero
  se dejó fuera a propósito.
- Los usuarios de prueba tienen contraseña `Test1234!`.

---

## Dónde retomar (sesión anterior: 2026-08-09)

**La app mobile funciona en dispositivo real**, contra el backend local y
Supabase. Login, inicio del cliente con selector de rubros, alta de petición,
mis peticiones, listado del profesional y perfil.

**Para levantar todo:**

```bash
# Terminal 1 — backend (0.0.0.0 para que lo alcance el celular)
dotnet run --project Marketplace.Api --urls http://0.0.0.0:5100

# Terminal 2 — app
cd mobile; npx expo start
```

Escanear el QR con Expo Go. Usuarios: `juan@test.com` (cliente) y
`carlos@test.com` (profesional), contraseña `Test1234!`.

**Trampas que ya nos costaron tiempo:**

- La IP de la PC está clavada en `mobile/app.json` → `expo.extra.apiUrl`.
  Si cambia, hay que actualizarla.
- **Cambiar `app.json` no se propaga con una recarga**: hay que reiniciar Metro
  *y* cerrar Expo Go por completo desde recientes. Recargar sacudiendo no basta.
- PowerShell no acepta `&&`; usar `;`.
- `address already in use` casi siempre significa que ya está corriendo.

**Render quedó pendiente a propósito.** Se desplegó y funcionó, pero el plan
gratuito duerme el servicio y la primera carga tarda ~15 s. Se retoma al salir
a producción, probablemente con el plan de USD 7 (sin suspensión y CPU dedicado,
que además acelera el login: ~1 s del tiempo es BCrypt). Guía en
[DESPLIEGUE.md](DESPLIEGUE.md), variables en `Marketplace.Api/.env.produccion`
(no versionado — **no borrar ese archivo**).

**Lo siguiente, a elección:** detalle del trabajo (hoy la lista no es
interactiva y es donde viven todas las acciones), ficha del profesional
(la pantalla del diferenciador), o la grilla de accesos rápidos estilo OSDE.

---

## Seguridad — estado y prioridades (revisado 2026-08-09)

> Sección de referencia. Los hallazgos están **verificados en el código**, no
> son sospechas. Ordenados por riesgo real, no por lo que reporte una herramienta.

### ⛔ NO correr `npm audit fix --force` en `mobile/`

Se evaluó y **rompe el proyecto**. Su plan de acción es:

```
Updating expo to 57.0.12          — SDK 57 NO lo soporta el Expo Go de las tiendas
Updating react-native to 0.72.17  — DOWNGRADE desde 0.81.5
change @react-native/virtualized-lists 0.81.5 -> 0.72.8
```

Deja paquetes internos mezclados entre 0.72 y 0.86, y vuelve a romper la
compatibilidad con Expo Go que costó resolver. **Decisión tomada: se conviven
con las vulnerabilidades de build.** Ver el detalle más abajo.

Para actualizar dentro de lo que el SDK permite: `npx expo install --fix`.

---

### ✅ Resuelto — RLS en Supabase (2026-08-11)

Supabase avisaba que las tablas del esquema `public` estaban expuestas sin Row
Level Security. **Era una alerta legítima:** Supabase publica ese esquema a
través de PostgREST, accesible con la clave anónima, que está pensada para ir
embebida en aplicaciones cliente y por lo tanto no es un secreto fuerte. Quien
la obtuviera podía leer y escribir todas las tablas salteándose la API.

**Solución aplicada** (migración `HabilitarRls`): RLS activo en las 9 tablas,
**sin políticas**. La API no se ve afectada porque se conecta con el rol
`postgres`, que es dueño de las tablas y tiene `BYPASSRLS`; los roles `anon` y
`authenticated` de PostgREST quedan alcanzados y, sin políticas, no ven ninguna fila.

Se usó `ENABLE` y no `FORCE` a propósito: `FORCE` aplicaría RLS también al dueño
y dejaría a la API sin acceso.

> **Si algún día se usa PostgREST directamente desde el cliente**, habrá que
> escribir políticas. Hoy no se usa: todo pasa por la API .NET.

Verificado: lecturas y escrituras de la API siguen respondiendo 200 con RLS activo.

### 🔴 Alto — explotable hoy, en código propio

**1. Fuga de direcciones de clientes.**
`GetByProfesionalAsync` ([TrabajoRepository.cs:42](Marketplace.Api/Infrastructure/Data/Repositories/TrabajoRepository.cs:42))
devuelve todos los trabajos sin asignar, y `TrabajoDto` incluye
`direccionDestino` más las coordenadas exactas. El registro de profesionales es
abierto y automático.
**Ataque:** registrarse como profesional con un DNI inventado → `GET /api/trabajos`
→ dirección exacta de todos los clientes del sistema.
**Contexto:** los usuarios son personas solas en su casa esperando a un
desconocido. Es el hallazgo más grave del proyecto.
**Solución diseñada:** revelación por etapas, sección 3.3.b de este documento.

**2. DNI y matrícula sin verificar.**
Los campos existen pero nada los valida. Cualquiera se declara "premium
matriculado". Es justamente el diferenciador del producto frente a Facebook
Marketplace, y hoy es una declaración sin respaldo.
**Mínimo:** revisión manual en el alta. **Ideal:** validar contra el registro
correspondiente (gasistas → ENARGAS; electricistas varía por jurisdicción).

**3. Credenciales débiles y registro sin límites.**
Los usuarios de prueba usan `Test1234!`. El registro público
(`/api/auth/register/...`) no tiene límite de intentos ni verificación de email.
Aceptable mientras la API no sea pública; **revisar antes de exponerla**.

### 🟠 Medio

**4. `PagarDeudaAsync` no cobra nada.**
Registra el asiento `pago_deuda` y limpia el estado Deudor sin transferencia
real detrás. Un profesional salda su deuda sin mover un peso. Ver Bloque 4.5.

**5. Postulaciones visibles entre competidores.**
`TrabajoDetalleDto.Postulaciones` va completo a cualquiera que consulte el
trabajo: un profesional ve los presupuestos de los demás. Ver sección 3.3.b.

**6. Token de 24 h sin renovación ni revocación.**
Un token robado vale un día completo y no hay forma de invalidarlo. Los refresh
tokens están previstos en el Bloque 2; una lista de revocación, en el Bloque 7.

### 🟢 Bajo — vulnerabilidades de npm (19 reportadas)

**No son 19 problemas: son 3 causas raíz** contadas a lo largo de la cadena de
dependencias.

| Paquete | Severidad | Qué permite |
|---|---|---|
| `image-size` 1.2.1 | alta | DoS: bucle infinito parseando ICNS/JXL/HEIF |
| `postcss` 8.4.49 | alta | Lectura de archivos vía `sourceMappingURL` manipulado |
| `uuid` 7.0.3 | media | Falta de control de límites de buffer en v3/v5/v6 |

**Por qué el riesgo real es bajo:** los tres corren en la **cadena de
compilación** (Metro, procesamiento de CSS, generación de proyectos Xcode).
Ninguno viaja en el bundle que llega al teléfono. Explotarlos exige meter un
archivo malicioso dentro del propio proyecto, es decir, acceso de escritura al
repositorio.

**Cuándo dejaría de ser bajo:** si hubiera integración continua compilando pull
requests de terceros, o si se aceptaran aportes externos de assets.

**Se resuelve solo** cuando Expo publique un SDK 54 con esas dependencias al día.

### Higiene de dependencias — pendiente

- [ ] **Dependabot** en GitHub: avisa de actualizaciones de seguridad nuevas
- [ ] **`npm audit` en CI**: detectar vulnerabilidades *nuevas*, no las ya
      evaluadas y aceptadas arriba
- [ ] `npx expo install --fix` periódicamente

### Orden sugerido de trabajo

Atacar del 1 al 6. El punto 1 primero. **El mejor momento es ahora, antes de
tener usuarios reales**: con datos de gente de verdad, cada arreglo implica
migración y ruptura de compatibilidad.

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
| 1  | admin@oficiosya.com | Administrador | admin |
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

## Bloque 2 — Supabase ✅ (aplicado 2026-08-09, falta corrida manual)

- [x] Proyecto Supabase creado (São Paulo, PostgreSQL 17.6)
- [x] Extensiones `postgis` y `btree_gist` creadas
- [x] Proveedor EF: SqlServer → Npgsql + NetTopologySuite, `EnableRetryOnFailure(3)`
- [x] Migración `InitialCreate` generada y aplicada: 8 tablas, 10 servicios sembrados
- [x] Coordenadas verificadas en la base como `numeric(10,7)`
- [x] Usuarios de prueba recreados (ids 2–5; admin es 1) — todos reciben token
- [ ] **Corrida manual del flujo completo sobre Postgres**
- [ ] PR `feature/migracion-supabase` → `master` (habrá conflicto en README.txt:
      master lo modificó, nosotros lo borramos — aceptar el borrado)
- [ ] Borrar `develop` una vez mergeado (es la base de la rama de feature)
- [ ] Refresh tokens (subido desde el Bloque 7: 24 h no sirve para mobile)

> **Trampa del `.env`:** DotNetEnv rompe si hay comillas dentro del valor. La
> connection string va con comillas simples envolviendo **todo** el valor y la
> password **sin** comillas. Documentado en `.env.example`.

### Notas de la migración original

Objetivo: Postgres + PostGIS andando, con el backend .NET apuntando ahí.

### 2.1 Crear la cuenta (esto lo hacés vos, yo no puedo)

1. Entrar a https://supabase.com → **Start your project**
2. Registrarte **con GitHub** (ya tenés cuenta, es lo más rápido)
3. **New project**:
   - Name: `oficiosya-mvp`
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
- [ ] **Postulaciones visibles entre competidores** — detectado 2026-08-09.
      `TrabajoDetalleDto.Postulaciones` va completo a cualquiera que consulte el trabajo,
      así que un profesional ve los presupuestos de los demás y puede ofertar apenas
      por debajo. Rompe la competencia, que es el sentido del modo postulaciones.
      El profesional debe recibir **solo la suya**; el cliente, la lista completa.
      (Hoy la UI usa ese array para saber si ya te postulaste: al restringirlo hay que
      exponer un campo `yaMePostule` o un endpoint propio.)
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

## ~~Bloque 4.5 — Modelo de cobros y comisiones~~ ❌ DESCARTADO (2026-08-10)

> **Este bloque ya no aplica.** Se diseñó para un modelo de comisión por trabajo
> que fue reemplazado por suscripciones al profesional. Ver la sección "Cambio de
> reglas de negocio" al inicio del documento.
>
> Se conserva por dos razones: el análisis de *quién recibe el dinero primero*
> sigue siendo válido si algún día se agrega cobro dentro de la app, y documenta
> por qué se descartó.

<details>
<summary>Contenido original (obsoleto)</summary>

Hoy la plataforma **no procesa ningún pago**: `tipo_pago` es solo una etiqueta. Eso
define todo lo demás.

### El problema

- **Efectivo:** la plata nunca pasa por la app → el 15 % es deuda genuina del
  profesional. Funciona hoy: asiento negativo + `Estado = Deudor`. ✅
- **Tarjeta / transferencia:** `CompletarAsync` tiene todo el bloque del ledger dentro
  de `if (tipoPago == "efectivo")`. Se crea el registro en `Pagos` con la comisión
  calculada, pero **nadie la debe ni nadie la cobra**. Número anotado sin efecto contable. ❌
- **`PagarDeudaAsync` no cobra nada:** registra `pago_deuda` y limpia el estado Deudor
  sin transferencia real detrás. Endpoint a confianza. ❌

### Modelo elegido: híbrido con compensación

- **Efectivo** → deuda (como hoy)
- **Tarjeta vía la app** → retención automática de la comisión, sin deuda; el
  profesional acumula **saldo a favor** pendiente de liquidación
- **Compensación:** la deuda de efectivo se descuenta de las liquidaciones de tarjeta.
  Si debe $3.000 y cobra $20.000 con tarjeta, se le liquidan $14.000, no $17.000.
  Resuelve la cobranza sin perseguir a nadie: mientras siga trabajando con tarjeta,
  la deuda se licúa sola.

### Tareas

- [ ] Integrar **Mercado Pago** en modo marketplace (retiene comisión de aplicación y
      liquida el resto al vendedor — es exactamente este caso)
- [ ] Ampliar el ledger: tipos `comision_retenida`, `liquidacion_pendiente`, `liquidacion_pagada`
- [ ] `CompletarAsync`: rama de tarjeta que acredite al profesional en vez de no hacer nada
- [ ] Compensación automática de deuda contra liquidaciones
- [ ] `PagarDeudaAsync`: exigir un pago real, no confianza
- [ ] Distinguir **quién recibe el dinero primero**, que es lo único que importa:
      | Adónde va | Comisión |
      |---|---|
      | Alias/cuenta **del profesional** (efectivo, transferencia directa, Posnet propio) | Deuda |
      | Cuenta **de la plataforma** (checkout de MP) | Retención automática |
      El `tipo_pago` **no debe elegirlo el profesional a mano** — si lo tipea él, va a
      marcar "efectivo" siempre. Debe surgir de cómo se cobró realmente.

> **Sin Posnet.** El checkout de Mercado Pago cobra desde el celular del cliente
> (tarjeta, saldo o transferencia), sin hardware. El profesional necesita una cuenta
> de Mercado Pago, no una terminal.
>
> **El modo marketplace divide el pago en el momento**, así que la plataforma nunca
> custodia plata ajena: el profesional conecta su cuenta una vez y cada cobro se
> reparte solo. Reduce mucho la carga regulatoria frente a cobrar y liquidar vos.

> **Ojo:** cobrarle al cliente y liquidarle al profesional significa manejar plata de
> terceros. Tiene implicancias fiscales y regulatorias. Consultar antes de operar.

</details>

## Bloque 5 — Tiempo real (~3 días)

- [ ] Tracking del profesional en viaje vía **Supabase Realtime** (el cliente se suscribe
      a los cambios de `ultima_ubicacion`, sin polling)
- [ ] Push cuando aparece un trabajo en tu radio
- [ ] Estados del trabajo en vivo (sin refrescar)

---

## Bloque 6 — App mobile con Expo (~3-4 semanas) 🚧 EN CURSO

### Hecho (2026-08-09)

- [x] Proyecto Expo **SDK 54** en `mobile/` (SDK 57 no lo soporta Expo Go de Play Store)
- [x] Navegación con expo-router, tabs según rol
- [x] Login funcionando en dispositivo real (Moto E32 vía Expo Go)
- [x] Token en SecureStore (Keychain/Keystore), no en almacenamiento plano
- [x] Sistema de diseño centralizado en `src/theme.ts`
- [x] Listado de trabajos leyendo de la API
- [x] Perfil con cierre de sesión
- [x] Backend con perfil `mobile (LAN)` escuchando en `0.0.0.0`

**Cadena verificada:** Supabase → API .NET → WiFi → celular.

### Notas de entorno

- La app apunta a `http://192.168.1.4:5100/api` (`app.json` → `expo.extra.apiUrl`).
  **Si cambia la IP de la PC hay que actualizarla ahí.**
- `mobile/.npmrc` tiene `legacy-peer-deps=true`: sin eso `expo install` falla.
- Nunca correr comandos de Expo con el directorio de trabajo en `frontend/`:
  instala `expo` donde no corresponde y reformatea `tsconfig.json`.

### Pendiente

- [ ] Detalle del trabajo (hoy la lista no es interactiva) — es donde viven todas
      las acciones: postularse, cambiar estado, completar
- [ ] Crear solicitud (cliente)
- [ ] **Ficha del profesional** — la pantalla más importante y la que no existe en
      ninguna referencia: matrícula y reseñas verificadas arriba de todo
- [ ] Mi saldo / movimientos
- [ ] Development build con EAS (Expo Go no alcanza para mapa ni push)
- [ ] Mapa de cercanía (depende del Bloque 3)

### Stack y herramientas

**Sin Android Studio, todo desde VS Code:**

```bash
npx create-expo-app@latest oficiosya-mobile
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
