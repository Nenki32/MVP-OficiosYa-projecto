# OficiosYa

**Plataforma para conectar a quien necesita una reforma, reparación o mantenimiento
del hogar con profesionales certificados de su zona.**

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Expo%2054-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)

---

## El problema

Cuando se rompe el termotanque un domingo, las opciones son preguntar en el grupo
del barrio, revolver Marketplace de Facebook o llamar a un número escrito en un
poste. Ninguna dice si la persona está matriculada, si trabajó bien antes, ni
cuánto va a salir.

OficiosYa apunta a las dos cosas que esas alternativas no pueden dar:

- **Credencial verificada** — en Argentina hay oficios que exigen matrícula por
  ley. La plataforma **verifica las credenciales antes** de permitir ofertar en
  rubros regulados. No es una declaración del profesional: es un control previo.
- **Reseñas que no se pueden inventar** — una reseña solo existe si hubo un
  trabajo real, confirmado por ambas partes. Es prueba de una transacción, no
  texto libre.

---

## Cómo funciona

### Para el cliente — gratis, siempre

1. **Publica el trabajo** describiendo qué necesita, la **zona aproximada**, un
   presupuesto estimado y el plazo deseado.
2. **Recibe presupuestos** de profesionales de su área.
3. **Elige con información**: compara precio, perfil del profesional o de la
   empresa, y sobre todo las valoraciones de otros usuarios.

### Para el profesional — el lado que paga

1. **Canal continuo de clientes**, sin invertir en publicidad propia.
2. **Filtrado por radio de acción**: ve solo los encargos cercanos a su zona y
   elige a cuáles presupuestar.
3. **Reputación digital**: acumular buenas opiniones aumenta su visibilidad y
   su probabilidad de ser contratado.

### Cierre del trabajo

Terminada la tarea, **cliente y profesional confirman** que el trabajo se
completó. Recién con esa doble confirmación el cliente accede a dejar su
reseña: puntuación de 1 a 5 estrellas y un comentario sobre cómo resolvió el
profesional.

Esa doble confirmación es lo que hace que las reseñas sean confiables: no se
puede reseñar un trabajo que no ocurrió.

---

## Modelo de negocio

**El cliente no paga nunca.** Los ingresos vienen del lado profesional:

| Vía | Cómo funciona |
|---|---|
| **Suscripción** | Tarifa mensual o anual para acceder a los trabajos publicados y enviar presupuestos, ilimitados o según el plan |
| **Comisión por contacto** | En ciertos planes, un importe fijo por establecer contacto directo con un cliente |

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 9 · C# · ASP.NET Core Web API |
| ORM | Entity Framework Core 9 · Npgsql |
| Base de datos | PostgreSQL 17 (Supabase) · PostGIS · btree_gist |
| Autenticación | JWT Bearer · BCrypt |
| Documentación | Swagger / OpenAPI |
| Mobile | React Native · Expo SDK 54 · expo-router |
| Frontend web | React 19 · TypeScript · Vite · Tailwind CSS 4 |

## Arquitectura

Monolito modular en **Clean Architecture**. Las dependencias apuntan hacia
adentro: `Delivery` e `Infrastructure` conocen a `Core`, nunca al revés.

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
│   ├── Data/                    DbContext, repositorios, migraciones
│   └── Security/                JWT, hashing
│
└── Config/                      Composition root (Program.cs)

mobile/                          App Expo (el producto)
├── app/                         Rutas — expo-router
└── src/
    ├── api/                     Cliente HTTP
    ├── auth/                    Sesión
    ├── components/              Piezas reutilizables
    └── theme.ts                 Sistema de diseño
```

### Decisiones de diseño

- **`IUnitOfWork`** agrupa escrituras de varios repositorios en una transacción.
- **Máquina de estados explícita** para los trabajos, validada en el caso de uso.
- **Sistema de diseño centralizado** en `mobile/src/theme.ts`: ningún componente
  define colores ni espaciados sueltos.
- **Sin tabla de coordenadas precargadas**: la ubicación sale del GPS del
  dispositivo, con permiso explícito del usuario.

---

## Puesta en marcha

### Requisitos

- .NET SDK 9.0+
- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (el plan gratuito alcanza)
- **Expo Go** en el celular (SDK 54)

### 1. Base de datos

Crear un proyecto en Supabase y habilitar las extensiones:

```sql
create extension if not exists postgis;     -- búsqueda por proximidad
create extension if not exists btree_gist;  -- turnos sin solapamiento
```

### 2. Variables de entorno

Copiar `Marketplace.Api/.env.example` a `Marketplace.Api/.env` y completarlo.
La connection string sale de **Project Settings → Database → Connection string**,
usando el **Session pooler** (puerto 5432):

```env
DB_CONNECTION='Host=aws-0-<region>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<ref>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true'
```

> ⚠️ No usar el *Transaction pooler* (6543): rompe los prepared statements de Npgsql.
> Envolver todo el valor en comillas simples y **no** poner comillas en la password:
> DotNetEnv falla si hay comillas dentro del valor.
> `.env` está en `.gitignore` — nunca commitearlo.

### 3. Esquema

```bash
dotnet ef database update --project Marketplace.Api
```

> **El esquema lo maneja EF Core, no el CLI de Supabase.** El registro está en la
> tabla `__EFMigrationsHistory`, por eso el dashboard de Supabase muestra su
> sección de migraciones vacía: es lo esperado.
>
> **No modificar tablas a mano desde el SQL Editor.** El snapshot de EF quedaría
> desincronizado. Todo cambio pasa por `dotnet ef migrations add`.

### 4. Backend

```bash
dotnet run --project Marketplace.Api --urls http://0.0.0.0:5100
```

Escucha en `0.0.0.0` para que el celular lo alcance en la red local.
Swagger queda en http://localhost:5100/swagger

### 5. App mobile

```bash
cd mobile
npx expo start
```

Escanear el QR con Expo Go.

> La IP de la PC está en `mobile/app.json` → `expo.extra.apiUrl`. Si cambia, hay
> que actualizarla. **Cambiar `app.json` exige reiniciar Metro y cerrar Expo Go
> por completo**: recargar no alcanza.

### 6. Frontend web (opcional)

```bash
cd frontend && npm install && npm run dev
```

---

## API

Todos los endpoints requieren `Authorization: Bearer <token>` salvo los marcados
como públicos.

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

### Reseñas

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/trabajos/{trabajoId}/resenia` | Calificar un trabajo completado |
| `GET` | `/api/profesionales/{profesionalId}/resenias` | Reseñas de un profesional |

### Cuenta corriente · rol `profesional`

| Método | Ruta |
|---|---|
| `GET` | `/api/cuenta-corriente/saldo` · `/movimientos` |
| `POST` | `/api/cuenta-corriente/pagar` |

### Administración · rol `admin`

| Método | Ruta |
|---|---|
| `GET` | `/api/admin/dashboard` |
| `GET` | `/api/admin/usuarios` · `/api/admin/usuarios/{id}` |
| `GET` | `/api/admin/trabajos` · `/api/admin/trabajos/{id}` |
| `GET` | `/api/admin/resenias` |

### Operativo

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de salud · **público**, no toca la base |

---

## Flujo de trabajo

| Rama | Propósito |
|---|---|
| `master` | Producción — rama por defecto, solo código estable |
| `feature/*` | Funcionalidad nueva |
| `fix/*` | Correcciones sobre una funcionalidad existente |
| `docs/*` | Solo documentación |

**Una rama, una cosa.** Cada funcionalidad nueva abre su propia rama desde
`master`; no se apila trabajo no relacionado sobre una rama ya abierta. Una
corrección va en una rama `fix/` de la funcionalidad a la que pertenece.

Mezclar temas en una rama hace que el Pull Request no se pueda revisar de a
partes y que no se pueda revertir una funcionalidad sin arrastrar las otras.

Los merges a `master` se hacen vía Pull Request.
