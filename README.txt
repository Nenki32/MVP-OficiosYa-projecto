================================================================================
MVP - ENCOYA: MARKETPLACE DE SERVICIOS DEL HOGAR
================================================================================
Gasistas, electricistas, plomeros, cerrajeros y mas con geolocalizacion
en tiempo real. Conecta clientes con profesionales del hogar.

================================================================================
ARQUITECTURA
================================================================================

Cliente (Web/React)
    |
API REST (.NET 9 / C#)
    |
SQL Server Express

Monolito modular en capas:
  Controllers  →  Services  →  Data (EF Core)  →  SQL Server

================================================================================
STACK TECNOLOGICO
================================================================================

Backend:   .NET 9 Web API + C#
ORM:       Entity Framework Core 9
BD:        SQL Server Express
Auth:      JWT Bearer + BCrypt
Docs:      Swagger / OpenAPI
Frontend:  React (proximamente)
Mobile:    React Native (proximamente)

================================================================================
BASE DE DATOS
================================================================================

Tablas principales:
  Usuarios            - Roles (cliente/profesional), niveles
                        (standard/premium) con validacion de DNI y matricula
  Servicios           - Categorias: gasista, electricista, plomero, etc.
  ProfesionalServicios - Relacion M:N profesional-servicio
  Trabajos            - Estados: pendiente -> aceptado -> viajando ->
                        en_progreso -> completado / cancelado
                        Coordenadas DECIMAL(10,7) para lat/lng
  Pagos               - Registro contable con monto y comision (15%)
  CuentaCorriente     - Ledger auditable para deudas de profesionales
                        Cuando un trabajo en efectivo se completa, se
                        debita automaticamente el 15% de comision
  Resenias            - Puntuacion 1-5 por trabajo completado

================================================================================
FUNCIONALIDADES
================================================================================

REGISTRO Y AUTENTICACION
  - Registro de clientes y profesionales
  - Profesional Standard: validacion por DNI
  - Profesional Premium: tecnico matriculado con numero de matricula
  - Login con JWT (7 dias de expiracion)

SOLICITUD Y GESTION DE TRABAJOS
  - Cliente crea solicitud con ubicacion y tipo de servicio
  - Profesional acepta trabajos disponibles
  - Maquina de estados: pendiente > aceptado > viajando > en_progreso > completado
  - Cancelacion en cualquier etapa por cliente o profesional
  - Actualizacion de geolocalizacion en tiempo real

PAGOS Y COMISIONES
  - Soporte para efectivo, tarjeta y transferencia
  - Pago en efectivo: el sistema registra el cobro y genera
    automaticamente un saldo deudor del 15% al profesional
  - Ledger contable (CuentaCorriente) con saldo posterior auditable
  - El profesional puede consultar su deuda y pagarla

RESENAS
  - Cliente califica al profesional al finalizar el trabajo
  - Historial de puntuaciones por profesional

================================================================================
API ENDPOINTS
================================================================================

Auth
  POST   /api/auth/register       Crear cuenta (cliente o profesional)
  POST   /api/auth/login          Iniciar sesion (devuelve JWT)
  GET    /api/auth/me             Perfil del usuario autenticado

Servicios
  GET    /api/servicios           Listar categorias de servicios
  GET    /api/servicios/{id}      Detalle de servicio

Trabajos
  POST   /api/trabajos            Crear solicitud (cliente)
  GET    /api/trabajos            Listar trabajos (segun rol)
  GET    /api/trabajos/{id}       Detalle del trabajo
  PATCH  /api/trabajos/{id}/estado       Cambiar estado
  PATCH  /api/trabajos/{id}/ubicacion    Actualizar ubicacion (profesional)
  POST   /api/trabajos/{id}/completar    Completar y registrar pago

Cuenta Corriente
  GET    /api/cuenta-corriente/saldo      Saldo actual del profesional
  GET    /api/cuenta-corriente/movimientos Historial de movimientos
  POST   /api/cuenta-corriente/pagar      Pagar deuda

Resenas
  POST   /api/trabajos/{id}/resenia       Calificar trabajo (cliente)
  GET    /api/profesionales/{id}/resenias  Ver resenas de un profesional

================================================================================
ESCALABILIDAD
================================================================================

Horizontal:
  - API stateless (JWT), permite escalar horizontalmente con
    balanceador de carga
  - Base de datos: indice por estado+ubicacion para busquedas
    de profesionales cercanos sin table scan

Vertical:
  - SQL Server Express tiene limite de 10GB, migrar a Standard
    cuando se supere
  - Indices cubridores en consultas frecuentes (dashboard, ledger)

Separacion futura:
  - Separar CuentaCorriente en microservicio de pagos
  - Cache de servicios/sesiones con Redis
  - SignalR para geolocalizacion en tiempo real
  - Worker service para conciliacion de pagos

================================================================================
SETUP LOCAL
================================================================================

1. Ejecutar database/initial_db_sqlserver.sql en SSMS
2. Ajustar connection string en Marketplace.Api/appsettings.json
3. dotnet run --project Marketplace.Api
4. Abrir https://localhost:7277/swagger

================================================================================
GIT WORKFLOW
================================================================================

main       - Produccion (solo codigo estable)
develop    - Integracion de features
feature/*  - Ramas por cada tarea (ej: feature/frontend-web)

Los merge a main se hacen via Pull Request en GitHub.

================================================================================
