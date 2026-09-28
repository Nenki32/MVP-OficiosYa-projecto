# Despliegue de la API, Configuración de Entornos y Seguridad Pre-Lanzamiento

Guía para configurar Marketplace.Api contra Supabase (São Paulo), empaquetar la API con Docker, conectar la app mobile de Expo sin clavar la IP local y aplicar el endurecimiento de seguridad antes de salir a producción.

=============================================================================
1. ANTES DE EMPEZAR
=============================================================================

- El repositorio cuenta con el Dockerfile en la raíz para empaquetar Marketplace.Api.
- La base de datos vive en Supabase (Región: South America / São Paulo — PostgreSQL 17.6).
- Tené a mano la connection string de Supabase usando siempre el "Session pooler" (puerto 5432).
  * No uses el Transaction pooler (puerto 6543) con EF Core: rompe los prepared statements de Npgsql.
  * La conexión directa (db.<ref>.supabase.co) es IPv6 y puede no resolver en todas las redes.
- Generá una clave JWT_KEY nueva para producción: no reutilices nunca la de desarrollo (si alguna vez se filtró el .env local, cualquiera podría firmar tokens válidos).

=============================================================================
2. VARIABLES DE ENTORNO DE LA API
=============================================================================

Estas variables tienen prioridad sobre el archivo .env local, el cual ni siquiera se copia a la imagen de producción porque está excluido en .dockerignore.

| Variable                  | Valor                                                                                      |
|---------------------------|--------------------------------------------------------------------------------------------|
| ASPNETCORE_ENVIRONMENT    | Production                                                                                 |
| DB_CONNECTION             | Cadena de Supabase Session Pooler (puerto 5432), SIN comillas en variables de servidor     |
| JWT_KEY                   | Clave nueva, larga y aleatoria (mínimo 32 bytes) — distinta de la de desarrollo            |
| JWT_ISSUER                | MarketplaceApi                                                                             |
| JWT_AUDIENCE              | MarketplaceClient                                                                          |
| ADMIN_EMAIL               | El email real del administrador                                                            |
| ADMIN_PASSWORD            | Contraseña fuerte exclusiva de producción, distinta de la local                            |
| CORS_ORIGINS              | Solo si se publica el frontend web; la app mobile no usa CORS                              |

Nota sobre DB_CONNECTION en desarrollo local (.env con DotNetEnv):
En el archivo Marketplace.Api/.env local, DotNetEnv falla si hay comillas dentro del valor. Ahí sí debe ir envuelta toda la cadena entre comillas simples y la password sin comillas:
DB_CONNECTION='Host=aws-0-sa-east-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.tu_ref;Password=TuPasswordSinComillas;SSL Mode=Require;Trust Server Certificate=true'

=============================================================================
3. VERIFICACIÓN DEL SERVICIO (/health) Y NOTAS DE OPERACIÓN
=============================================================================

1. Endpoint de salud (/health):
   La API expone el endpoint GET /health para comprobar que el contenedor vive y las variables críticas están bien cargadas:
   
   Respuesta esperada (HTTP 200):
   { "estado": "ok", "servicio": "oficiosya-api", "hora": "..." }

   Si falla al iniciar, revisar los logs del contenedor: la API valida DB_CONNECTION y JWT_KEY al arrancar y falla con un mensaje explícito si faltan o tienen formato inválido.

2. Comportamiento en Producción:
   - El esquema ya está aplicado en Supabase. La API NO corre migraciones automáticamente al arrancar; cuando se agregue una migración nueva de EF Core, se aplica aparte con "dotnet ef database update".
   - Al arrancar se crea el usuario administrador si no existe, usando ADMIN_EMAIL y ADMIN_PASSWORD.
   - Swagger solo se expone en Development (ASPNETCORE_ENVIRONMENT=Development), por lo que en producción no estará disponible. Para verificar que la API responde, usar siempre /health.

=============================================================================
4. APUNTAR LA APP MOBILE (DETECCIÓN AUTOMÁTICA DE IP LAN + PRODUCCIÓN)
=============================================================================

En lugar de cambiar manualmente mobile/app.json (expo.extra.apiUrl), reiniciar Metro y forzar el cierre de Expo Go desde recientes cada vez que cambia la IP WiFi de tu PC, configura el cliente HTTP (mobile/src/api/client.ts) con expo-constants:

-----------------------------------------------------------------------------
import Constants from 'expo-constants';

export const getBaseApiUrl = (): string => {
  // 1. Si se definió una variable de entorno explícita (ej. servidor de Producción), tiene prioridad:
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. En desarrollo local con Expo Go, detecta sola la IP LAN de la PC donde corre Metro:
  const debuggerHost = Constants.expoConfig?.hostUri; // Ej: "192.168.1.4:8081"
  const lanIp = debuggerHost?.split(':')[0];

  if (__DEV__ && lanIp) {
    return `http://${lanIp}:5100/api`;
  }

  // 3. Fallback al valor configurado en mobile/app.json -> expo.extra.apiUrl:
  return Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:5100/api';
};
-----------------------------------------------------------------------------

Si prefieres definir la URL pública en mobile/app.json para un build de producción:
  "extra": { "apiUrl": "https://<tu-dominio-api>/api" }

=============================================================================
5. ENDURECIMIENTO DE SEGURIDAD PRE-LANZAMIENTO
=============================================================================

Antes de abrir la API a usuarios reales, verificar obligatoriamente estos 5 controles:

1. Rate Limiting en Autenticación (.NET 9 nativo):
   Los endpoints /api/auth/login y /api/auth/register deben tener límite de intentos por IP en Program.cs para frenar ataques de fuerza bruta y creación automatizada de cuentas falsas:

-----------------------------------------------------------------------------
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

// Después de var app = builder.Build():
app.UseRateLimiter();
// Y decorar AuthController o los endpoints de login/registro con: [EnableRateLimiting("auth")]
-----------------------------------------------------------------------------

2. Eliminación de Usuarios de Prueba en Producción:
   Asegurar que los usuarios de prueba con contraseña débil "Test1234!" (juan@test.com, maria@test.com, carlos@test.com, pedro@test.com) nunca se creen ni existan en la base de producción. Cualquier script o seed de usuarios de prueba debe ejecutarse únicamente si app.Environment.IsDevelopment() es true.

3. Row Level Security (RLS) en Nuevas Tablas de Supabase:
   Las 9 tablas actuales ya tienen RLS activo sin políticas (bloqueando el acceso directo vía PostgREST con la clave anónima, mientras la API .NET opera con el rol postgres que posee BYPASSRLS).
   Por cada tabla nueva que se agregue en el futuro (Tareas, ProfesionalTareas, Turnos, Planes, Suscripciones), incluir siempre en el método Up() de la migración de EF Core:
   migrationBuilder.Sql("ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;");
   (Usar siempre ENABLE y nunca FORCE, para no bloquear al dueño postgres que usa la API).

4. Restricción de CORS por Entorno:
   En Program.cs, verificar que AllowAnyOrigin() esté restringido exclusivamente a Development. En producción, leer los orígenes permitidos desde la variable CORS_ORIGINS.

5. Revelación por Etapas y Privacidad de Datos Personales:
   Verificar que ningún endpoint de listado o detalle de trabajos pendientes devuelva direccionDestino exacta, coordenadas sin redondear ni el teléfono del cliente antes de que el trabajo esté asignado a ese profesional, cumpliendo con la protección de domicilio de los clientes y la Ley 25.326 de Protección de Datos Personales (Argentina).