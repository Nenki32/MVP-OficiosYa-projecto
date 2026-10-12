# SEGURIDAD — OficiosYa

Hallazgos verificados en código propio (§1), controles obligatorios antes de abrir la API a usuarios reales (§2), checklist completo de 19 controles con su estado (§3) y errores criptográficos de implementación a evitar (§4). El análisis es estrictamente defensivo. Los requisitos de seguridad de la web de producción están en ROADMAP.md, Bloque 8.3.

## 1. Hallazgos en código propio (atacar en orden)

### 🔴 Alto — explotable hoy

**1. Fuga de direcciones de clientes** — 🟡 resuelto en lo principal, queda abierta la triangulación
- **Original:** `GetByProfesionalAsync` devolvía todos los trabajos sin asignar con `direccionDestino` y coordenadas exactas. Ataque: registrarse como profesional con un DNI inventado → `GET /api/trabajos` → dirección exacta de todos los clientes.
- ✅ **Arreglado:** `TrabajoUseCase.cs:97` redondea las coordenadas para profesionales no asignados.
- ⬜ **Abierto — triangulación por distancia:** hoy `distanciaKm` se redondea a 0,1 km y se calcula contra la ubicación exacta. Con esa precisión, un profesional puede consultar el trabajo desde dos o tres ubicaciones distintas y triangular la casa con un margen de unos 100 m. Cambiar el redondeo a **1 km entero** (mínimo 1) para trabajos no asignados. La pantalla mobile debe mostrarlo como `~N km`.
- **Revelación por etapas:**
  - Antes de asignarse: barrio + distancia redondeada + coordenada redondeada a 2 decimales (~1,1 km). Lo mismo para el teléfono (oculto).
  - Turno confirmado: dirección exacta solo para el profesional asignado.
  - Trabajo completado: revocar o conservar durante la ventana de disputa y luego anonimizar (decisión abierta en ROADMAP.md).
- Test de regresión pendiente (no hay proyecto de test todavía): ver TESTING.md §7, prioridad 1.

**2. DNI y matrícula sin verificar**
- `dni` y `numero_matricula` existen pero nada los valida: cualquiera se declara "premium matriculado".
- Mínimo: revisión manual en el alta. Ideal: validar contra el registro correspondiente (gasistas → ENARGAS; electricistas varía por jurisdicción). Versión 0.0.7.

**3. Credenciales débiles y registro sin límites**
- Usuarios de prueba con `Test1234!`. El registro público (`/api/auth/register/...`) no tiene rate limiting ni verificación de email. Ver controles 2.1 y 2.2.

### 🟠 Medio

**4. Código residual de cobros (`PagarDeudaAsync` y CuentaCorriente)**
- `PagarDeudaAsync` limpiaba deuda sin pago real detrás. Con el modelo de suscripción, eliminar esos endpoints y casos de uso para no dejar superficie expuesta.

**5. Postulaciones visibles entre competidores** — ✅ resuelto
- **Original:** `TrabajoDetalleDto.Postulaciones` iba completo a cualquiera, así que un profesional veía los presupuestos de los demás.
- ✅ **Arreglado:** `TrabajoUseCase.cs:162` filtra las postulaciones: el profesional recibe solo la suya y el cliente, la lista completa.
- Queda cubrirlo con test de regresión (TESTING.md §7, prioridad 1).

**6. Token de 24 h sin renovación ni revocación**
- Un token robado vale un día completo y no se puede invalidar; y en mobile pedir login a diario es motivo de desinstalación. Implementar refresh tokens y lista de revocación, o migrar a Supabase Auth (decisión abierta). Versión 0.0.12.

**7. Concurrencia al aceptar un trabajo**
- Dos profesionales simultáneos pasan ambos la validación. Resolver con `UPDATE ... WHERE estado='pendiente'` condicional o `xmin`. Versión 0.0.12.

### 🟢 Bajo — vulnerabilidades de npm (19 reportadas, 3 causas raíz)
- image-size 1.2.1 (alta: DoS parseando ICNS/JXL/HEIF), postcss 8.4.49 (alta: lectura vía sourceMappingURL), uuid 7.0.3 (media: límites de buffer).
- Riesgo real bajo: los tres corren solo en la compilación local (Metro, CSS, generación Xcode) y ninguno viaja en el bundle.
- ⛔ **No correr `npm audit fix --force` en `mobile/`:** intenta subir expo a 57.0.12 (no soportado por Expo Go de las tiendas) y bajar react-native de 0.81.5 a 0.72.17. Usar `npx expo install --fix`.
- Higiene pendiente: Dependabot en GitHub y `npm audit` en CI.

## 2. Controles obligatorios antes del lanzamiento

**2.1 Rate limiting en autenticación (.NET 9 nativo)**

`/api/auth/login` y `/api/auth/register` con límite de intentos por IP en `Program.cs`:

```csharp
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
// Decorar AuthController o los endpoints de login/registro con [EnableRateLimiting("auth")]
```

**2.2 Sin usuarios de prueba en producción**

Los usuarios con `Test1234!` (juan@, maria@, carlos@, pedro@test.com) nunca deben existir en la base de producción. Todo seed de prueba se ejecuta solo si `app.Environment.IsDevelopment()` es true.

**2.3 RLS en tablas nuevas**

Las 9 tablas actuales tienen RLS activo sin políticas (bloquea PostgREST con la clave anónima; la API opera con el rol postgres, que tiene BYPASSRLS). Toda tabla nueva (Tareas, ProfesionalTareas, Turnos, Planes, Suscripciones) incluye en el `Up()` de su migración:

```csharp
migrationBuilder.Sql("ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;");
```

Siempre ENABLE, nunca FORCE (FORCE bloquearía al dueño postgres que usa la API).

**2.4 CORS por entorno**

En `Program.cs`, `AllowAnyOrigin()` solo en Development. En producción, orígenes desde `CORS_ORIGINS`.

**2.5 Privacidad por etapas y datos personales**

Ningún endpoint de listado o detalle de trabajos no asignados devuelve dirección exacta, coordenadas sin redondear, distancia exacta ni teléfono del cliente, en cumplimiento de la Ley 25.326 de Protección de Datos Personales. Verificado por los tests de TESTING.md, no solo por revisión manual.


## 3. Checklist de seguridad (19 controles)

**Estados:** ✅ hecho · 🟡 parcial · ⬜ pendiente · ❓ verificar en el código. Actualizar el estado al cerrar cada versión.

Todo endpoint nuevo pasa por los controles 6, 7, 8, 14 y 17 antes de mergearse.

### A. Secretos y claves

**1. Ocultar API keys** — ❓
- Regla clave: todo lo que empieza con `EXPO_PUBLIC_` (mobile) o `VITE_` (web) **se incrusta en el bundle y es público**. Ahí solo puede ir la URL de la API, nunca una clave.
- La connection string, `JWT_KEY`, la `service_role` de Supabase y el access token de Mercado Pago viven solo en el backend, como variables de entorno.
- Verificar: buscar `EXPO_PUBLIC_` y `VITE_` en todo el repo y revisar que ninguno tenga secretos.

**2. Eliminar secretos de Git** — ❓
- `.env` en `.gitignore` (además de `.dockerignore`, que ya está). Subir un `.env.example` con los nombres de las variables y valores vacíos.
- Escanear el historial con `gitleaks detect`. **Si un secreto estuvo commiteado alguna vez, se rota** (nueva password de la base, nueva `JWT_KEY`): borrarlo del historial no alcanza, porque pudo haberse clonado.
- Agregar gitleaks a la CI para frenar commits con secretos.

**3. Clave pública de la base (anon key de Supabase)** — 🟡
- La anon key es pública por diseño: la seguridad depende 100 % de RLS. Hoy la app no la usa (todo pasa por la API) y RLS bloquea todo, así que es segura.
- **Cambia en 0.0.8 y 0.0.13:** Supabase Storage (foto de perfil) y Realtime (tracking) sí usan la anon key desde la app. Antes de activarlos hacen falta políticas RLS específicas (control 4).

**4. Row Level Security** — 🟡
- ✅ Activo en las 9 tablas, sin políticas (todo bloqueado para anon y authenticated). Toda tabla nueva lo incluye en su migración (2.3).
- ⬜ Políticas puntuales cuando la app acceda directo a Supabase: Storage (cada usuario solo escribe su propia foto) y Realtime (un cliente solo ve la ubicación del profesional asignado a su trabajo).
- ⚠️ La API conecta con el rol postgres (BYPASSRLS): RLS **no** protege contra un bug de la API. Ahí el control real es la autorización (controles 6 y 7).

**5. Encriptar datos sensibles** — 🟡
- 🟡 En tránsito: la conexión a Supabase va cifrada (`SSL Mode=Require`), pero sin verificar el certificado (ver control 18). ✅ En el teléfono: token en SecureStore.
- En reposo, Supabase ya encripta el disco. Para DNI y número de teléfono, evaluar cifrado a nivel columna (ASP.NET Core Data Protection o pgcrypto), así un volcado de la base no los expone en texto plano.
- Documentos de matrícula y DNI: bucket **privado** de Storage, accesibles solo con URLs firmadas de vida corta (para el admin que revisa).

### B. Autenticación y sesión

**6. Forzar la autenticación** — ❓
- Política global que exige usuario autenticado en todos los endpoints, con excepciones explícitas:
  ```csharp
  builder.Services.AddAuthorization(options =>
  {
      options.FallbackPolicy = new AuthorizationPolicyBuilder()
          .RequireAuthenticatedUser()
          .Build();
  });
  ```
- `[AllowAnonymous]` solo en login, registro, `/health` y, en el futuro, la landing y fichas públicas. Así un endpoint nuevo nace protegido aunque alguien se olvide del `[Authorize]`.

**7. Restringir el acceso a registros (IDOR)** — ⬜
- Que un usuario esté logueado no significa que pueda ver cualquier registro. Todo `GET/PUT/DELETE /{id}` verifica que el registro pertenezca al usuario (o que sea admin).
- El ID del usuario sale **siempre** de los claims del token, nunca del body ni de la URL.
- Casos a cubrir: un cliente consultando o editando la petición de otro cliente; un profesional cancelando un trabajo que no tiene asignado.

**8. Bloquear la manipulación de campos (mass assignment)** — ⬜
- Los endpoints reciben DTOs de entrada con solo los campos editables, nunca la entidad.
- Campos que **solo** asigna el servidor: `rol`, `nivel_profesional`, estado de verificación de matrícula, `estado` del trabajo, `ClienteId`, `ProfesionalAsignadoId`, vigencia de suscripción, confirmaciones.
- Ejemplo de riesgo real: registrarse enviando `"nivelProfesional": "premium"` o `"estadoVerificacion": "verificado"`. Relacionado con el 500 al registrar un premium sin matrícula (0.0.7).

**9. Proteger cookies de sesión** — ⬜ (web)
- Mobile no usa cookies (token en SecureStore). La web de producción usa cookies `HttpOnly` + `Secure` + `SameSite=Strict` (ROADMAP 8.3), nunca el JWT en localStorage.

**10. Hashear contraseñas (BCrypt)** — 🟡
- ✅ **Ya existe:** `IPasswordHasher` con BCrypt en `Infrastructure/Security/PasswordHasher.cs`. Se mejora ese servicio; no se crea otro.
- **Por qué BCrypt:** es lento a propósito y ajustable (work factor), genera una sal aleatoria por contraseña y la guarda dentro del propio hash. SHA-256 o MD5 son rápidos justamente para lo que no queremos: con una GPU se prueban miles de millones por segundo.
- ⬜ **Lo que falta:**
  1. **Work factor configurable, en 12.** Hoy no se sabe con cuál hashea (el default de `BCrypt.Net-Next` es 11). Leerlo de `Seguridad:BcryptWorkFactor`; debe tardar unos 250 ms por hash en el servidor de producción, y en tests se baja a 4.
  2. **Rehash transparente.** Agregar a la interfaz un método que indique si el hash guardado quedó con un work factor menor; si es así, el login exitoso guarda el hash nuevo. Los usuarios existentes se actualizan solos, sin cambiar la contraseña.
  3. **Límite de 72 bytes, validando en vez de usar `Enhanced`.** BCrypt ignora lo que pasa de 72 bytes. La variante `EnhancedHashPassword` lo evita, pero sus hashes **no verifican** con `Verify` común y tienen el mismo prefijo `$2`, así que cambiarla rompería el login de todos los usuarios actuales. Es más simple validar en el registro y en el cambio de contraseña: mínimo 8 caracteres y máximo **72 bytes en UTF-8**.
- **Cambio sugerido** (ajustar a los nombres reales de la interfaz existente):
  ```csharp
  // Interfaz existente: agregar solo NecesitaRehash
  public interface IPasswordHasher
  {
      string Hash(string password);
      bool Verify(string password, string hash);
      bool NecesitaRehash(string hash);
  }

  // Infrastructure/Security/PasswordHasher.cs
  public class PasswordHasher : IPasswordHasher
  {
      private readonly int _workFactor;

      public PasswordHasher(IConfiguration config)
      {
          _workFactor = config.GetValue("Seguridad:BcryptWorkFactor", 12);
      }

      public string Hash(string password) =>
          BCrypt.Net.BCrypt.HashPassword(password, _workFactor);

      public bool Verify(string password, string hash) =>
          BCrypt.Net.BCrypt.Verify(password, hash);

      public bool NecesitaRehash(string hash) =>
          BCrypt.Net.BCrypt.PasswordNeedsRehash(hash, _workFactor);
  }

  // En el login, después de verificar con éxito:
  if (_passwordHasher.NecesitaRehash(usuario.PasswordHash))
  {
      usuario.PasswordHash = _passwordHasher.Hash(request.Password);
      await _usuarioRepository.UpdateAsync(usuario);
  }
  ```
- **Mensajes de error:** el login fallido devuelve siempre "Email o contraseña incorrectos", sin revelar cuál falló (evita enumerar emails registrados). Junto con el rate limiting (control 11), frena la fuerza bruta.
- El hash nunca sale en ninguna respuesta ni en logs (control 17).

### C. Abuso y automatización

**11. Rate limiting** — ⬜
- Login y registro: 5 por minuto por IP (2.1).
- Sumar límites a acciones que se pueden abusar: publicar trabajos, postularse y subir archivos (por usuario, no solo por IP).

**12. Protección contra bots** — ⬜
- Verificación de email en el registro (y OTP por SMS si se migra a Supabase Auth).
- Web: CAPTCHA invisible en registro y publicación (por ejemplo, Cloudflare Turnstile).
- La verificación manual de matrícula ya frena perfiles falsos en rubros regulados.

### D. Entradas y salidas

**13. Parametrizar queries** — ❓
- EF Core con LINQ ya parametriza. El riesgo está en el SQL crudo (por ejemplo, consultas PostGIS): usar `FromSql` / `FromSqlInterpolated` / `ExecuteSql`, **nunca** `FromSqlRaw` o `ExecuteSqlRaw` con texto concatenado.
- Verificar: buscar `FromSqlRaw` y `ExecuteSqlRaw` en el repo.

**14. Validar inputs** — 🟡
- En el backend, siempre (la app puede ser saltada con Postman): DataAnnotations o FluentValidation en cada request, con `[ApiController]` devolviendo 400 automático.
- Reglas concretas: montos > 0 y con tope; radio ∈ {5, 10, 15, 20}; latitud −90..90 y longitud −180..180; largo máximo en descripciones, comentarios y razón social; formato de email, DNI y CUIT.

**15. Sanitizar contenido** — 🟡
- Se guarda el texto tal como llega y se escapa al mostrarlo. React y React Native escapan por defecto; está prohibido `dangerouslySetInnerHTML` (ROADMAP 8.3).
- Ojo a futuro con contenido de usuario en emails, notificaciones push, plantillas de WhatsApp y metaetiquetas OpenGraph de las fichas públicas.

**16. Restringir archivos** — ⬜ (entra con la foto de perfil, 0.0.8)
- Solo tipos permitidos (JPG, PNG, WebP; PDF para documentación), verificando el contenido real del archivo y no solo la extensión.
- Tamaño máximo (por ejemplo, 5 MB) y nombre generado por el servidor (UUID), nunca el nombre original.
- **Eliminar metadatos EXIF:** una foto sacada con el celular puede llevar las coordenadas GPS exactas de la casa, lo que rompería la privacidad por etapas.
- Fotos de perfil en bucket público; documentación en bucket privado (control 5).

**17. Devolver solo los datos necesarios** — 🟡
- Siempre DTOs, nunca entidades de EF. Nunca `PasswordHash`, DNI completo, ni datos de otros usuarios que no correspondan.
- Privacidad por etapas (hallazgos 1 y 5).
- En producción, errores sin stack traces ni detalles internos: el cuerpo uniforme de CONVENCIONES.md §2.

### E. Infraestructura

**18. Security headers y forzar HTTPS** — ⬜
- API en producción: `app.UseHsts()` y `app.UseHttpsRedirection()`, más `X-Content-Type-Options: nosniff`. Los headers de la web están en ROADMAP 8.3.
- Mobile: `http://` solo en desarrollo (IP LAN). El build de producción usa `https://` en `EXPO_PUBLIC_API_URL`; Android bloquea el tráfico sin cifrar por defecto en producción, y no hay que habilitarlo.
- **Hallazgo — conexión API → Supabase sin verificar el certificado.** La cadena actual usa `SSL Mode=Require;Trust Server Certificate=true`: el tráfico va cifrado, pero la API no comprueba que del otro lado esté realmente Supabase. Un atacante en la red entre el servidor de la API y la base podría presentar su propio certificado (man-in-the-middle) y leer la password de la base y todos los datos. En Npgsql 6+ `Require` ya no valida el certificado por sí solo, así que `Trust Server Certificate` es además redundante.
  - Solución en producción: `SSL Mode=VerifyFull` + el certificado raíz de Supabase, que se descarga desde el dashboard (Database Settings → SSL Configuration). Con eso Npgsql verifica la firma, la vigencia y que el host coincida.
  - El certificado raíz es **público** (no es un secreto): se puede commitear en el repo y copiar a la imagen Docker.
  - En desarrollo local se puede mantener `Require`; en producción, nunca.

> **Por qué importa (resumen de TLS 1.3):** el servidor envía su certificado → el cliente lo verifica contra una autoridad certificadora → ambos derivan la misma clave secreta con Diffie-Hellman efímero (ECDHE), sin enviarla → el resto viaja con cifrado simétrico. El cifrado sin la verificación del certificado no protege contra un intermediario: te conectás de forma cifrada, pero quizás con la persona equivocada. HSTS existe para que el navegador nunca intente el paso previo por `http://`.

**19. Escanear dependencias** — ⬜
- Dependabot en GitHub para NuGet y npm.
- En CI: `dotnet list package --vulnerable --include-transitive`, `npm audit` (solo reporte; en `mobile/` se arregla con `npx expo install --fix`, nunca `--force`) y gitleaks (control 2).


## 4. Criptografía: errores de implementación

La mayoría de los incidentes criptográficos no vienen de algoritmos rotos sino de cómo se usan. Cada error está traducido a dónde podría aparecer en OficiosYa y qué usar en su lugar.

### Error 1: claves hardcodeadas en el código

```ts
const key = "1234567890123456"; // ❌
```

- **Problema:** la clave queda en el repo y en el bundle. Un APK de Expo se descompila en minutos, y todo lo que está en `EXPO_PUBLIC_*` o `VITE_*` también es legible.
- **En OficiosYa:** ninguna clave en `mobile/`, `frontend/` ni en `appsettings.json`. `JWT_KEY`, la connection string, la `service_role` de Supabase y el access token de Mercado Pago viven solo como variables de entorno del servidor (controles 1 y 2).
- **Regla de oro para mobile:** si la app necesita una clave para cifrar algo, el diseño está mal. Lo sensible se cifra o se firma en el backend, y la app solo recibe resultados.

### Error 2: reutilizar IV o nonce

- **Problema:** con AES-GCM, repetir un nonce con la misma clave permite recuperar información de los mensajes y falsificar datos cifrados.
- **En OficiosYa:** no cifrar a mano con `AesGcm`. Para cifrar columnas (DNI, teléfono; control 5) usar **ASP.NET Core Data Protection**, que genera un IV nuevo por operación y gestiona las claves por vos.
- Si alguna vez hace falta `AesGcm` directo: nonce de 12 bytes con `RandomNumberGenerator.Fill` en cada operación, guardado junto al texto cifrado. Nunca un contador reiniciable ni un valor fijo.

### Error 3: generadores aleatorios no seguros

```csharp
new Random().Next(1000, 9999);   // ❌ predecible
```
```ts
Math.random();                   // ❌ predecible
```

- **En OficiosYa esto aplica a valores concretos** que deben ser impredecibles:
  - Código de cierre de 4 dígitos (0.0.11): `RandomNumberGenerator.GetInt32(0, 10000)` formateado con `D4`.
  - Refresh tokens y tokens de recuperación de contraseña: `RandomNumberGenerator.GetBytes(32)` en Base64Url.
  - Nombres de archivos subidos: `Guid.NewGuid()` alcanza (no es secreto, solo único).
- **Mobile:** si alguna vez hace falta aleatoriedad segura, `expo-crypto` (`getRandomBytes`), nunca `Math.random()`. Lo ideal es que la genere el backend.
- **Generar `JWT_KEY`:** `openssl rand -base64 48`, nunca una frase inventada.

### Error 4: implementar criptografía propia

- **Problema:** un detalle mal hecho (padding, comparación, derivación de claves) rompe todo, y no se nota en las pruebas porque "funciona".
- **En OficiosYa, usar siempre lo probado:**
  | Necesidad | Usar |
  |---|---|
  | Contraseñas | BCrypt vía el `IPasswordHasher` existente, work factor 12 configurable y rehash en el login (control 10) |
  | JWT | `Microsoft.AspNetCore.Authentication.JwtBearer`, validando firma, issuer, audience y expiración; algoritmo fijo (HS256), nunca aceptar `none` |
  | Cifrar datos en reposo | ASP.NET Core Data Protection |
  | Aleatoriedad | `RandomNumberGenerator` (.NET), `expo-crypto` (mobile) |
  | Transporte | TLS (HTTPS y `SSL Mode=VerifyFull`, control 18) |
  | Guardar el token en el teléfono | `expo-secure-store` (Keychain / Keystore) |
- Prohibido: XOR "casero", Base64 como si fuera cifrado, MD5 o SHA-256 solos para contraseñas.

### Error 5: almacenamiento inseguro de claves

- **Problema:** claves en texto plano, accesibles desde varios sistemas y sin registro de quién las usó.
- **Trampa específica de .NET en Docker:** Data Protection guarda su anillo de claves en el disco del contenedor. Si el contenedor se recrea, las claves se pierden y **los datos cifrados quedan ilegibles para siempre**. Antes de cifrar la primera columna hay que persistir el anillo fuera del contenedor y protegerlo con otra clave:
  ```csharp
  builder.Services.AddDataProtection()
      .SetApplicationName("oficiosya")
      .PersistKeysToDbContext<AppDbContext>()   // anillo de claves en la base (tabla con RLS)
      .ProtectKeysWithCertificate(certificado); // y cifrado con un certificado que NO está en la base
  ```
  Así, un volcado de la base no alcanza para descifrar: falta el certificado, que vive en el gestor de secretos del hosting.
- **KMS / Vault, en proporción al proyecto:** un HSM o AWS KMS propio es desproporcionado para la etapa actual (regla Karpathy #2). El mínimo sensato hoy:
  - Secretos en el gestor de variables del hosting de la API, nunca en archivos dentro de la imagen.
  - Acceso a esos secretos solo para quien despliega.
  - Rotación documentada de `JWT_KEY` y de la password de la base (control 2).
  - Al escalar o si el hosting lo ofrece: Azure Key Vault, AWS KMS o Supabase Vault para las claves de Data Protection y las credenciales de Mercado Pago.

### Error 6 (extra): comparar secretos con `==`

- **Problema:** `==` corta en el primer carácter distinto; midiendo tiempos se puede adivinar un token de a un carácter.
- **En OficiosYa:** al comparar el código de cierre, tokens de recuperación o firmas de webhooks (Mercado Pago), usar `CryptographicOperations.FixedTimeEquals`.
- Además: los refresh tokens se guardan **hasheados** en la base (SHA-256 alcanza, porque son aleatorios de 32 bytes), igual que una contraseña nunca se guarda en claro.

### Ejemplo integrado: lo que NO tiene que pasar en OficiosYa

Un atacante descarga el APK de la app y encuentra:
- una clave en `EXPO_PUBLIC_*` que firma o cifra algo,
- códigos de cierre generados con `Math.random()` en el cliente,
- y un "cifrado" propio del DNI.

Con eso puede completar trabajos ajenos, falsificar datos y leer documentos, sin romper ningún algoritmo. **El diseño correcto:** la app no tiene ningún secreto; el backend genera los códigos con `RandomNumberGenerator`, cifra con Data Protection, y las claves viven fuera del código y fuera del contenedor. Aunque comprometan la app, las claves siguen protegidas.
