# Despliegue de la API en Render

Guía para publicar `Marketplace.Api` en Render con el plan gratuito.
La base de datos ya vive en Supabase: acá solo se despliega la API.

---

## Antes de empezar

- El repositorio tiene que estar en GitHub con el `Dockerfile` en la raíz.
- Tené a mano la connection string de Supabase (Session pooler, puerto 5432).
- **Generá una clave JWT nueva para producción.** No reutilices la de desarrollo:
  si alguna vez se filtró el `.env`, cualquiera podría firmar tokens válidos.

---

## 1. Crear el servicio

1. Entrar a [render.com](https://render.com) y registrarse con GitHub.
2. **New → Web Service** y elegir el repositorio.
3. Configuración:

   | Campo | Valor |
   |---|---|
   | Language / Runtime | **Docker** |
   | Branch | `master` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | **Free** ← verificar explícitamente |
   | Health Check Path | `/health` |
   | Region | la más cercana disponible |

> **No cargues método de pago.** Sin tarjeta asociada no hay forma de que se
> genere un cobro: el peor caso es que el servicio deje de funcionar.

> **No agregues una base de datos de Render.** La base es Supabase.

---

## 2. Variables de entorno

En **Environment → Add Environment Variable**:

| Variable | Valor |
|---|---|
| `DB_CONNECTION` | La cadena de Supabase, **sin comillas** (acá no interviene DotNetEnv) |
| `JWT_KEY` | Clave nueva, larga y aleatoria — distinta de la de desarrollo |
| `JWT_ISSUER` | `MarketplaceApi` |
| `JWT_AUDIENCE` | `MarketplaceClient` |
| `ADMIN_EMAIL` | El email del administrador |
| `ADMIN_PASSWORD` | Contraseña fuerte, distinta de la local |
| `CORS_ORIGINS` | Solo si vas a publicar el frontend web; la app mobile no usa CORS |

Estas variables tienen prioridad sobre el `.env`, que ni siquiera se copia a la
imagen (está en `.dockerignore`).

---

## 3. Verificar

Cuando termine el despliegue, Render te da una URL del estilo
`https://encoya-api.onrender.com`.

```
https://<tu-servicio>.onrender.com/health
```

Tiene que responder:

```json
{ "estado": "ok", "servicio": "encoya-api", "hora": "..." }
```

Si falla, mirá los **Logs** en Render. El error más probable es una variable
de entorno mal cargada: la API valida `DB_CONNECTION` y `JWT_KEY` al arrancar
y falla con un mensaje explícito.

---

## 4. Apuntar la app mobile

En `mobile/app.json`, cambiar `expo.extra.apiUrl` por la URL pública:

```json
"extra": { "apiUrl": "https://<tu-servicio>.onrender.com/api" }
```

---

## Lo que hay que saber del plan gratuito

- **El servicio se duerme tras unos 15 minutos sin peticiones.** El siguiente
  acceso lo despierta, pero tarda cerca de un minuto. Avisale a quien vaya a
  probar la app, o va a pensar que está rota.
- Que vos trabajes todos los días no lo mantiene despierto: cuentan los
  minutos desde la última petición, no los días desde el último uso.
- Render no tiene región en Sudamérica. Con la base en São Paulo, cada consulta
  cruza el continente. Es tolerable para probar, no para producción real.
- Las condiciones de los planes gratuitos cambian: verificá las vigentes.

---

## Notas

- El esquema **ya está aplicado** en Supabase. La API no corre migraciones al
  arrancar; si en el futuro agregás alguna, hay que aplicarla aparte.
- Al arrancar se crea el usuario administrador si no existe, usando
  `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- Swagger solo se expone en Development, así que en Render no va a estar
  disponible. Para verificar que la API vive, usá `/health`.
