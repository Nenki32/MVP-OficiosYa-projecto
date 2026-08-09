# EncoYá

**Marketplace de servicios del hogar con geolocalización.** Conecta a quien tiene un
problema en su casa con el profesional matriculado más cercano, sin pasar por
Marketplace de Facebook ni por clasificados.

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Estado](https://img.shields.io/badge/estado-MVP%20en%20desarrollo-orange)

---

## El problema

Cuando se te rompe el termotanque un domingo, tus opciones son preguntar en el grupo
del barrio, revolver Marketplace de Facebook o llamar a un número escrito en un poste.
Ninguna te dice si la persona está matriculada, si trabajó bien antes, ni cuánto va a salir.

EncoYá apunta a las dos cosas que esas alternativas no pueden dar:

- **Credencial verificable** — el nivel *premium* exige número de matrícula. Ser gasista
  matriculado es una categoría legal, no una autopercepción.
- **Reseñas que no se pueden inventar** — una reseña solo existe si hubo un trabajo
  completado en la plataforma. Es prueba de una transacción real, no texto libre.

## Estado

MVP en desarrollo activo. El backend y el flujo de negocio están funcionando; la capa de
geolocalización y la app mobile están en construcción. El plan de trabajo detallado,
con prioridades y decisiones tomadas, vive en **[ROADMAP.md](ROADMAP.md)**.

| Componente | Estado |
|---|---|
| API REST (.NET 9) | ✅ Funcionando |
| Modelo de dominio y ledger de comisiones | ✅ Funcionando |
| Frontend web (React) | ✅ Funcionando — banco de pruebas, no producto final |
| Migración a PostgreSQL + PostGIS | 🚧 En curso |
| Búsqueda por proximidad | ⏳ Pendiente |
| Agenda y turnos | ⏳ Pendiente |
| App mobile (Expo) | ⏳ Pendiente — **este es el producto real** |

> La web existe para validar arquitectura y funcionalidad. El producto final es una
> aplicación mobile; el diseño visual se hace una sola vez, ahí.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 9 · C# · ASP.NET Core Web API |
| ORM | Entity Framework Core 9 · Npgsql |
| Base de datos | PostgreSQL 17 (Supabase) · PostGIS · btree_gist |
| Autenticación | JWT Bearer · BCrypt |
| Documentación | Swagger / OpenAPI |
| Frontend web | React 19 · TypeScript · Vite · Tailwind CSS 4 |
| Mobile *(previsto)* | React Native · Expo |

## Arquitectura

Monolito modular en **Clean Architecture**. Las dependencias apuntan hacia adentro:
`Delivery` y `Infrastructure` conocen a `Core`, nunca al revés.

```
Marketplace.Api/
├── Core/                        Dominio — sin dependencias de framework
│   ├── Models/                  Entidades
│   ├── Interfaces/              Contratos (repos, servicios, unit of work)
│   └── UseCases/                Reglas de negocio
│
├── Delivery/                    Capa HTTP
│   ├── Controllers/
│   ├── DTOs/
│   └── Middleware/              Manejo centralizado de errores
│
├── Infrastructure/              Detalles técnicos
│   ├── Data/                    DbContext, repositorios, unit of work
│   └── Security/                JWT, hashing
│
└── Config/                      Composition root (Program.cs)
```

### Decisiones de diseño

- **`IUnitOfWork`** agrupa escrituras de varios repositorios en una transacción. Sin
  esto, completar un trabajo podía dejar una comisión adeudada sin el pago que la justifica.
- **Ledger contable en vez de un campo de saldo.** `CuentaCorriente` es append-only:
  cada movimiento guarda monto y saldo posterior. El saldo es auditable y reconstruible.
- **Máquina de estados explícita** para los trabajos, con transiciones validadas en el
  caso de uso, no dispersas por los controladores.

## Modelo de datos

| Tabla | Rol |
|---|---|
| `Usuarios` | Clientes, profesionales y admin. Nivel *standard* (DNI) o *premium* (matrícula) |
| `Servicios` | Catálogo de rubros: gasista, electricista, plomero, etc. |
| `ProfesionalServicios` | Relación M:N — en qué rubros trabaja cada profesional |
| `Trabajos` | Solicitudes, con coordenadas y máquina de estados |
| `Postulaciones` | Profesionales que se ofrecen a un trabajo, con presupuesto |
| `Pagos` | Registro contable por trabajo, con comisión del 15 % |
| `CuentaCorriente` | Ledger auditable de deudas de profesionales |
| `Resenias` | Puntuación 1–5, única por trabajo completado |

**Ciclo de vida de un trabajo:**

```
pendiente ──> aceptado ──> viajando ──> en_progreso ──> completado
    │             │            │             │
    └─────────────┴────────────┴─────────────┴──────> cancelado
```

**Comisiones.** Al completar un trabajo pagado en efectivo, el sistema registra el cobro
íntegro y genera un asiento negativo del 15 % en la cuenta corriente del profesional.
El saldo queda deudor hasta que lo salda. Todo dentro de una misma transacción.

---

## Puesta en marcha

### Requisitos

- .NET SDK 9.0+
- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (el plan gratuito alcanza)

### 1. Base de datos

Creá un proyecto en Supabase y habilitá las extensiones necesarias desde el SQL Editor:

```sql
create extension if not exists postgis;     -- búsqueda por proximidad
create extension if not exists btree_gist;  -- turnos sin solapamiento
```

### 2. Variables de entorno

Copiá `Marketplace.Api/.env.example` a `Marketplace.Api/.env` y completalo.

La connection string se saca de **Project Settings → Database → Connection string**,
usando el **Session pooler** (puerto 5432). Convertila al formato clave-valor que
espera Npgsql:

```env
DB_CONNECTION=Host=aws-0-<region>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<ref>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

> ⚠️ No uses el *Transaction pooler* (puerto 6543): rompe los prepared statements de Npgsql.
> `.env` está en `.gitignore` — nunca lo commitees.

### 3. Esquema

```bash
dotnet ef database update --project Marketplace.Api
```

> **El esquema lo maneja EF Core, no el CLI de Supabase.** El registro de migraciones
> vive en la tabla `__EFMigrationsHistory`, por eso el dashboard de Supabase muestra
> su sección de migraciones vacía: es lo esperado.
>
> **No modifiques tablas a mano desde el SQL Editor.** El snapshot de EF quedaría
> desincronizado y la próxima migración fallaría o intentaría deshacer el cambio.
> Todo cambio de esquema pasa por `dotnet ef migrations add`. Las extensiones
> (`postgis`, `btree_gist`) son la excepción: viven fuera del modelo.

### 4. Backend

```bash
dotnet run --project Marketplace.Api
```

Swagger queda en http://localhost:5100/swagger

### 5. Frontend

```bash
cd frontend && npm install && npm run dev
```

Disponible en http://localhost:5173 (proxea `/api` al backend).

---

## API

Todos los endpoints requieren `Authorization: Bearer <token>` salvo los marcados como públicos.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register/cliente` | Alta de cliente · **público** |
| `POST` | `/api/auth/register/profesional` | Alta de profesional · **público** |
| `POST` | `/api/auth/login` | Inicio de sesión · **público** |
| `POST` | `/api/auth/logout` | Cierre de sesión |

### Servicios

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/servicios` | Catálogo de rubros · **público** |
| `GET` | `/api/servicios/{id}` | Detalle de un rubro · **público** |

### Trabajos

| Método | Ruta | Rol |
|---|---|---|
| `POST` | `/api/trabajos` | cliente |
| `GET` | `/api/trabajos` | según rol |
| `GET` | `/api/trabajos/{id}` | — |
| `PATCH` | `/api/trabajos/{id}/estado` | — |
| `PATCH` | `/api/trabajos/{id}/ubicacion` | profesional asignado |
| `POST` | `/api/trabajos/{id}/completar` | profesional asignado |
| `POST` | `/api/trabajos/{id}/postularse` | profesional |
| `GET` | `/api/trabajos/{id}/postulaciones` | cliente dueño / admin |
| `POST` | `/api/trabajos/{id}/asignar/{profesionalId}` | cliente dueño |

### Cuenta corriente · rol `profesional`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/cuenta-corriente/saldo` | Saldo actual |
| `GET` | `/api/cuenta-corriente/movimientos` | Historial del ledger |
| `POST` | `/api/cuenta-corriente/pagar` | Saldar deuda |

### Reseñas

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/trabajos/{trabajoId}/resenia` | Calificar un trabajo completado |
| `GET` | `/api/profesionales/{profesionalId}/resenias` | Reseñas de un profesional |

### Administración · rol `admin`

| Método | Ruta |
|---|---|
| `GET` | `/api/admin/dashboard` |
| `GET` | `/api/admin/usuarios` · `/api/admin/usuarios/{id}` |
| `GET` | `/api/admin/trabajos` · `/api/admin/trabajos/{id}` |
| `GET` | `/api/admin/resenias` |

---

## Escalabilidad

**Ahora.** La API es stateless (JWT), así que escala horizontalmente detrás de un
balanceador. Los índices cubren las consultas de dashboard y ledger.

**Cuando haga falta.** PostGIS con índices GiST para la búsqueda por radio; Supabase
Realtime para el seguimiento en vivo; caché de catálogo y sesiones; separación del
módulo de pagos si el volumen lo justifica.

## Flujo de trabajo

| Rama | Propósito |
|---|---|
| `master` | Producción — rama por defecto, solo código estable |
| `feature/*` | Una rama por tarea |

Los merges a `master` se hacen vía Pull Request.

---

## Documentación

- **[ROADMAP.md](ROADMAP.md)** — plan de trabajo, prioridades, decisiones tomadas y
  riesgos identificados.
