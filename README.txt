# 🏡 MVP Encoya: Marketplace de Servicios del Hogar

> **Conecta clientes con profesionales del hogar en tiempo real.** 
> Encuentra gasistas, electricistas, plomeros, cerrajeros y más con geolocalización integrada.

---

## 🏗️ Arquitectura

El sistema está diseñado bajo un modelo de **monolito modular en capas**, garantizando una clara separación de responsabilidades y un mantenimiento ágil.

```text
  Cliente (Web/React)
          │
  API REST (.NET 9 / C#)
          │
  SQL Server Express

Flujo de la solución: Controllers ➔ Services ➔ Data (EF Core) ➔ SQL Server

---

💻 Stack Tecnológico

Backend: .NET 9 Web API + C#

ORM: Entity Framework Core 9

Base de Datos: SQL Server Express

Autenticación & Seguridad: JWT Bearer + BCrypt

Documentación: Swagger / OpenAPI

Frontend: React (Próximamente)

Mobile: React Native (Próximamente)

---
🗄️ Base de Datos

Tablas Principales

Usuarios: Gestión de roles (Cliente / Profesional) y niveles (Standard / Premium). Incluye validación de DNI y número de matrícula.

Servicios: Catálogo de categorías disponibles (gasista, electricista, plomero, cerrajero, etc.).

ProfesionalServicios: Tabla intermedia para soportar la relación de muchos a muchos (M:N) entre profesionales y sus especialidades.

Trabajos: Registro del ciclo de vida del servicio. Almacena coordenadas geográficas mediante el tipo DECIMAL(10,7) para latitud y longitud.

Pagos: Registro contable de transacciones, aplicando automáticamente una comisión del 15%.

CuentaCorriente: Ledger (libro contable) auditable que registra las deudas de los profesionales. Cuando se completa un trabajo en efectivo, se debita de forma automática el 15% de comisión.

Reseñas: Sistema de puntuación de 1 a 5 estrellas asociado a cada trabajo finalizado.
---
✨ Funcionalidades

🔐 Registro y Autenticación

Flujo de registro para clientes y prestadores de servicios.

Profesional Standard: Requiere validación por DNI.

Profesional Premium: Requiere número de matrícula habilitante y validación técnica.

Inicio de sesión seguro con generación de token JWT (expiración de 7 días).

🛠️ Solicitud y Gestión de Trabajos

El cliente genera una solicitud especificando el tipo de servicio y su ubicación actual.

El profesional visualiza los trabajos disponibles en su zona y los acepta.

Máquina de Estados: Pendiente ➔ Aceptado ➔ Viajando ➔ En Progreso ➔ Completado.

Soporte de cancelación flexible en cualquier etapa del flujo por cualquiera de las partes.

Actualización dinámica de la geolocalización en tiempo real.

💰 Pagos y Comisiones

Flexibilidad de medios de pago: efectivo, tarjeta y transferencia.

Flujo de Efectivo: El sistema procesa el cierre del trabajo y asienta de manera automática un saldo deudor del 15% en la cuenta del profesional.

Auditoría Contable: Libro de movimientos (CuentaCorriente) transparente que calcula el saldo posterior de forma auditable. El profesional puede consultar su saldo y saldar su deuda desde la app.

⭐ Reseñas y Calificaciones

Cierre de ciclo: el cliente evalúa el desempeño del profesional al concluir la tarea.

Historial reputacional público por cada prestador.

🔌 API Endpoints

Autenticación (/api/auth)

POST/api/auth/register- Crear cuenta (cliente o profesional)

POST/api/auth/login - Iniciar sesión (devuelve el JWT)

GET/api/auth/me - Obtener el perfil del usuario autenticado

Servicios (/api/servicios)

GET/api/servicios - Listar todas las categorías de servicios

GET/api/servicios/{id}	- Ver el detalle de una categoría específica

Trabajos (/api/trabajos)

POST/api/trabajos -	Crear una nueva solicitud de servicio (Cliente)

GET/api/trabajos - Listar trabajos históricos o activos (según Rol)

GET/api/trabajos/{id} - Ver el detalle completo de un trabajo

PATCH/api/trabajos/{id}/estado - Actualizar el estado en la máquina de estados

PATCH	/api/trabajos/{id}/ubicacion - Actualizar coordenadas en tiempo real (Profesional)

POST	/api/trabajos/{id}/completar - Finalizar el trabajo y registrar la transacción de pago

POST	/api/trabajos/{id}/resenia - Registrar la calificación del trabajo (Cliente)

Cuenta Corriente (/api/cuenta-corriente)

GET/api/cuenta-corriente/saldo - Consultar el saldo deudor actual del profesional

GET/api/cuenta-corriente/movimientos - Listar el historial de movimientos del ledger

POST/api/cuenta-corriente/pagar - Registrar pago para saldar deuda acumulada


Reseñas Públicas

GET/api/profesionales/{id}/resenias - Consultar el historial de reseñas de un profesional

---

🚀 Escalabilidad y Evolución

Escalabilidad Horizontal

Estrategia Stateless: Al delegar la sesión en tokens JWT, la API puede replicarse detrás de un balanceador de carga sin necesidad de compartir estado de sesión.

Optimización de Consultas: Creación de índices combinados basados en Estado + Ubicación para resolver de forma eficiente las búsquedas de profesionales cercanos sin penalizar la base de datos con table scans.

--> Escalabilidad Vertical

--> Migración de Datos: Monitoreo del almacenamiento ante el límite de 10GB de SQL Server Express. Arquitectura lista para migrar a SQL Server Standard/Enterprise.

--> Diseño de índices cubridores (covering indexes) enfocados en las consultas de alta frecuencia como el libro contable y dashboards de control.

Arquitectura Futura (Evolución del Monolito)

Microservicios: Desacoplamiento del módulo de CuentaCorriente hacia un microservicio independiente de pagos y conciliación.

Capa de Caché: Incorporación de Redis para almacenar en caché las categorías de servicios y sesiones recurrentes.

Eventos en Tiempo Real: Implementación de SignalR para optimizar la transferencia de coordenadas de geolocalización.

Procesamiento Batch: Uso de un Worker Service dedicado a la auditoría y conciliación nocturna de saldos contables.

⚙️ Setup Local

Seguí estos pasos para configurar el entorno de desarrollo en tu máquina:

Ejecutá el script de base de datos ubicado en database/initial_db_sqlserver.sql dentro de tu instancia de SQL Server Management Studio (SSMS).

Actualizá la cadena de conexión (ConnectionStrings) en el archivo de configuración Marketplace.Api/appsettings.json.

Levantá el proyecto ejecutando el siguiente comando desde la terminal en la raíz del backend:

dotnet run --project Marketplace.Api

Abrí tu navegador e ingresá a la interfaz interactiva de pruebas:
👉 https://localhost:7277/swagger

---

🌿 Git Workflow

Mantenemos un flujo de trabajo ordenado basado en ramas para asegurar la estabilidad del proyecto:

main: Rama de producción. Aloja únicamente código certificado, estable y testeado.

develop: Rama de integración para desarrollo continuo y pruebas integrales.

feature/*: Ramas de trabajo específicas para tareas o funcionalidades (ej: feature/frontend-web, feature/accounting-ledger).









