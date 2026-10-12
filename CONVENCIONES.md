# CONVENCIONES DE CÓDIGO Y GIT — OficiosYa

## 1. Acceso a datos
- Solo la capa Infrastructure usa el `DbContext`. Controllers y casos de uso usan repositorios o servicios; si falta una consulta, se agrega ahí, no inline. (Pendiente: sacar `AppDbContext` de `TrabajosController`.)
- La privacidad por etapas se aplica al proyectar la consulta (`Select` al DTO) siempre que se pueda; si se sanitiza después de cargar, el método de sanitización tiene test obligatorio.
- Toda tabla nueva: `ENABLE ROW LEVEL SECURITY` en el `Up()` de su migración.
- Las reglas de negocio se calculan en la API (como `faltantes` del perfil), nunca duplicadas en mobile o web.

## 2. Endpoints
- Estructura: Request/Response DTOs → validación → caso de uso → respuesta.
- Nombres: `{Accion}Request`, `{Accion}Response`; métodos asíncronos con sufijo `Async`.
- Validación de entrada con DataAnnotations (montos > 0, campos obligatorios).
- Cuerpo de error uniforme en toda la API (mobile ya lee `mensaje`):
  ```json
  { "exito": false, "codigoError": "TRABAJO_NO_DISPONIBLE", "mensaje": "El trabajo ya fue asignado." }
  ```
- El ID y el rol del usuario actual se obtienen de los claims con un único helper, nunca parseando claims en cada controller.
- Roles con `[Authorize(Roles = ...)]` y constantes (`Roles.Profesional`), nunca strings sueltos como `"profesional"`.
- Autenticación obligatoria por defecto (FallbackPolicy); `[AllowAnonymous]` solo donde está justificado.
- Todo endpoint con `{id}` verifica que el registro pertenezca al usuario del token.
- Los DTOs de entrada no incluyen campos que solo asigna el servidor (rol, nivel, estados, verificación, IDs de dueño).
- SQL crudo solo con `FromSql`/`FromSqlInterpolated`, nunca `FromSqlRaw` con texto concatenado.

## 3. Enums guardados en la base (estados del trabajo, roles, planes, verificación)
- Se guardan como string (`HasConversion<string>()`), no como entero.
- SE PUEDEN AGREGAR valores; NO renombrar ni borrar existentes sin migración de datos.
- Mobile y web siempre contemplan un valor desconocido (`default`) sin romperse, porque una versión vieja de la app puede recibir un estado nuevo (por ejemplo `pendiente_confirmacion` o `agendado`).

## 4. Contrato entre capas
- Los tipos TypeScript de los DTOs viven en un archivo por cliente (`mobile/src/api/types.ts`; en web, el equivalente en `frontend/`). Prohibido `any` en respuestas de la API.
- Cambiar un DTO implica revisar `mobile/` y `frontend/` en el mismo cambio.

## 5. Estilos: carpeta `styles/` (mobile y web)

Todo el código de diseño vive en `styles/`. Las pantallas y componentes solo contienen estructura y lógica: importan sus estilos, no los definen.

> **Estado actual y transición (CLAUDE.md, invariante 7):** hoy existen `mobile/src/theme.ts` y 15 pantallas con `StyleSheet.create` propio. Las pantallas **nuevas** siguen esta estructura desde ya e importan los tokens desde `mobile/src/theme.ts`. La migración de las existentes y el traslado de `theme.ts` a `styles/theme.ts` se hacen juntos en la versión 0.0.14, como cambio aparte.

### Mobile: `mobile/src/styles/`
```
mobile/src/styles/
├── theme.ts                  # Tokens: colores, tipografía, espaciados, radios, sombras
├── comunes.ts                # Estilos compartidos: botones, inputs, tarjetas, badges de estado
└── pantallas/                # Un archivo por pantalla, espejando la estructura de app/
    ├── solicitar.styles.ts
    └── profesional/
        └── trabajoDetalle.styles.ts
```
- Cada archivo de `pantallas/` exporta un `StyleSheet.create` construido con los tokens de `theme.ts`.
- Nada de colores, tamaños o espaciados con valores sueltos: si falta un valor, se agrega como token en `theme.ts`.
- Estilos inline solo para valores dinámicos (ej. `opacity: pressed ? 0.75 : 1`), nunca para valores fijos.
- ⚠️ Nunca crear archivos de estilos dentro de `mobile/app/`: expo-router toma cualquier archivo de esa carpeta como una ruta.
- Paquetes con `npx expo install`, nunca `npm install` directo para dependencias nativas.

### Web: `frontend/src/styles/`
```
frontend/src/styles/
├── tokens.css                # Variables CSS traducidas de mobile/src/styles/theme.ts
├── global.css                # Reset, tipografía base y modo de foco visible
└── componentes/              # Un CSS Module por componente o página
    └── FichaProfesional.module.css
```
- `tokens.css` replica los valores de `theme.ts` para que app y web se vean como el mismo producto. Un cambio de token se hace en ambos lados en el mismo cambio.
- Los componentes importan su CSS Module desde `styles/componentes/` y usan solo variables de `tokens.css`.
- Sin estilos inline con valores fijos ni clases utilitarias sueltas en el JSX: el diseño no se mezcla con el marcado.

## 6. Orden dentro de un archivo (de lo general al detalle)
- Constantes arriba, después el tipo o componente principal, y los tipos auxiliares abajo.
- Constructores primero, métodos públicos después, privados al final.
- Un método que llama a otro va arriba del método llamado, para leer la cadena de llamadas hacia abajo.

## 7. Imports y usings
- C#: System → paquetes externos → proyectos de la solución.
- TypeScript: react/react-native → librerías → módulos internos → relativos.
- Sin rutas totalmente calificadas inline si el tipo se usa más de una vez.

## 8. Logging
- Backend: `ILogger<T>`, nunca `Console.WriteLine`.
- Mobile y web: sin `console.log` en código que se commitea.

## 9. Formato
- C#: 4 espacios, definido en `.editorconfig`. TypeScript: 2 espacios.
- Nullable reference types activado: los opcionales se marcan con `?`.

## 10. Git y versiones (flujo vigente desde 2026-09-29)

Cada versión es un PR a master que sube `version` en `mobile/app.json` y lleva su tag (ej. `v0.0.6`). Una sola rama activa por vez, para probar en vivo en Expo Go sin cortar.

1. `feature/vX.Y.Z` sale desde master y junta todos los commits de feature de esa versión. Se prueba con `git pull` (Expo Go recarga solo; la API se reinicia solo si cambió el backend).
2. Probadas las features, `fix/vX.Y.Z` sale **desde la feature** con los arreglos. Si hace falta, `bug/vX.Y.Z` sale del fix.
3. Probados los arreglos, se suben a la rama feature (no van directo a master).
4. El PR a master sale de la feature con todo: `version` en `mobile/app.json` + tag.

**Ciclo:**
```powershell
git checkout master; git pull
git checkout -b feature/v0.0.X
# trabajar, commitear
git push -u origin feature/v0.0.X
# PR -> master, mergear, taggear, borrar la rama
```

**Reglas que siguen vigentes del esquema anterior ("una rama, una cosa"):**
- Una versión contiene solo lo que su fila del ROADMAP dice. Lo que no pertenece a la versión espera a la siguiente, no se cuela.
- Cambios solo de documentación: `docs/<tema>` desde master.
- Commits chicos y de un solo tema dentro de la rama de versión, para poder revertir una funcionalidad sin arrastrar otras.

> Precedente a evitar: `feature/perfil-profesional` terminó cargando perfil, geolocalización, RLS y calendarios en siete commits mezclados.
