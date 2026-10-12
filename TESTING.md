# TESTING — OficiosYa

## 1. Proyecto de test

> **Estado actual:** no hay ningún proyecto de test. El backend es un solo proyecto, `Marketplace.Api`, con carpetas Core / Infrastructure / Delivery.

- **A crear:** un único proyecto `Marketplace.Api.Tests` (xUnit) que referencia a `Marketplace.Api`. Sus carpetas espejan las del backend:
  ```
  Marketplace.Api.Tests/
  ├── Core/             # Lógica pura: casos de uso, reglas, privacidad por etapas
  ├── Infrastructure/   # PasswordHasher, repositorios (los de base, con Testcontainers)
  ├── Delivery/         # Endpoints con WebApplicationFactory
  └── Builders/         # Datos de prueba compartidos
  ```
- No se divide en varios proyectos de test mientras el backend sea uno solo (regla Karpathy #2).
- **Cuándo:** el primer test (privacidad por etapas, §7 prioridad 1) entra en la próxima versión que toque `TrabajoUseCase`, sin esperar a 0.0.14. La 0.0.14 suma cobertura amplia y CI.
- Mobile: jest-expo + React Native Testing Library, instalados con `npx expo install` (cuando haya lógica que lo justifique).

## 2. Tests con base de datos
- Usan Testcontainers con la imagen `postgis/postgis` (misma versión mayor que Supabase). Requieren Docker.
- **Nunca EF Core InMemory:** no soporta PostGIS ni consultas espaciales, así que los tests de distancia y radio pasarían sin probar nada.
- Se conectan SOLO vía `TEST_DB_CONNECTION`. El setup aborta si el nombre de la base no contiene `test` o si el host contiene `supabase`.
- Se marcan con `[Trait("Category", "Database")]`. Sin Docker: `dotnet test --filter "Category!=Database"`.
- Corren en paralelo: cada test crea sus propios usuarios, trabajos y postulaciones. Solo los que modifican estado global se marcan para correr en serie.
- Las migraciones se aplican una vez por contenedor, no por test.
- No agregar tests con base de datos salvo que se pida explícitamente.

## 3. Servicios externos
- Nunca llamar servicios reales (Mercado Pago, mails, push, geocoding) desde tests: usar un `HttpMessageHandler` falso en .NET y mocks en jest.

## 4. Ejecución
- Todo: `dotnet test`
- Solo lógica pura (sin Docker): `dotnet test --filter "Category!=Database"`
- Una clase: `dotnet test --filter PrivacidadPorEtapaTests`
- Chequeo rápido de compilación: `dotnet build`
- Mobile: `npx jest` dentro de `mobile/`

## 5. Organización
- Una clase de test por clase probada: `TrabajoUseCase` → `TrabajoUseCaseTests`.
- Nombres: `Metodo_Escenario_ResultadoEsperado` (ej. `AplicarPrivacidad_ProfesionalNoAsignado_OcultaDireccion`).
- Clases anidadas por categoría solo si hay 2 o más tests; máximo dos niveles.
- Helpers compartidos en la clase padre o en `Builders/`, sin duplicarse.
- Arrange / Act / Assert en cada test.

## 6. Orden dentro de un archivo de test
1. Usings
2. Constantes (IDs, montos, coordenadas de prueba)
3. Tests agrupados por categoría
4. Helpers y builders al final

## 7. Qué testear (por prioridad)
1. **Privacidad por etapas:** profesional no asignado no recibe dirección, coordenadas exactas, distancia exacta ni teléfono; ningún profesional ve postulaciones ajenas. Cubrir cliente dueño, profesional asignado, profesional no asignado y admin. Hoy está arreglado en `TrabajoUseCase.cs` (:97 coordenadas, :162 postulaciones) sin test que lo proteja: es el **primer test del proyecto**. Incluye que `distanciaKm` de un trabajo no asignado sea un entero en km (triangulación).
2. **Bloqueos de negocio:** presupuestar con suscripción vencida o en rubro regulado sin verificación.
3. **Acceso y manipulación:** un usuario no puede leer ni modificar registros ajenos (IDOR → 403/404); enviar campos protegidos (`rol`, `nivelProfesional`, `estadoVerificacion`, `estado`) no los cambia; un endpoint sin `[AllowAnonymous]` devuelve 401 sin token.
4. **Rate limiting** de `/api/auth/login` y `/api/auth/register` (respuesta 429), y que el login fallido devuelva el mismo mensaje exista o no el email.
5. **Seeds:** los usuarios de prueba no se crean fuera de Development.
6. **Enums guardados en la base:** que cada valor se serialice al string esperado y vuelva igual (los strings son contrato).
7. **Validaciones y casos borde:** presupuesto con coma o punto, vacío, cero, negativo; radio fuera de 5/10/15/20; coordenadas fuera de rango; textos que superan el largo máximo; direcciones cortas en el geocoding.
   Archivos (desde 0.0.8): tipo no permitido, tamaño excedido, archivo con extensión falsa y que el EXIF se elimine.
8. **Concurrencia al aceptar:** dos aceptaciones simultáneas, solo una gana (con base de datos).
9. **Mapeo de errores** a códigos HTTP y al cuerpo uniforme de CONVENCIONES.md.

## 8. Qué no testear
- DTOs, getters o construcción trivial de objetos.
- Pantallas mobile puramente visuales sin lógica.
- Hashing de contraseñas en exceso: BCrypt es lento a propósito. En los tests se usa `Seguridad:BcryptWorkFactor = 4` y alcanzan cuatro casos: la contraseña correcta verifica, una incorrecta no, dos hashes de la misma contraseña son distintos (sal), y un hash con work factor menor da `NecesitaRehash == true`. Más el caso de validación: una contraseña de más de 72 bytes en UTF-8 se rechaza en el registro.

## 9. Imports en tests
- Fixtures y constantes con `using`/`import` arriba, no con rutas largas inline.
