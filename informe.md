# Informe de avances del proyecto

Fecha: 2026-07-02

## Contexto general

El proyecto esta pasando de una pagina estatica a una arquitectura con:

- Web publica.
- Panel administrativo.
- API propia.
- Base de datos PostgreSQL.
- Futuro chatbot con IA.

Por ahora el foco fue dejar la base tecnica funcionando con Docker, PostgreSQL y una API preparada para crecer por modulos.

## Estructura del proyecto

El repositorio funciona como monorepo con `npm workspaces` y Turbo.

Servicios principales:

- `apps/nexus-corp-web`: web publica.
- `apps/admin-panel-web`: panel administrativo.
- `apps/api`: API backend.
- `packages/ui`: paquete compartido de UI.

Archivos Docker principales:

- `docker-compose.yml`
- `Dockerfile.web.dev`
- `Dockerfile.admin.dev`
- `Dockerfile.api.dev`

## Cambio de Express a Hono

La API inicialmente estaba usando Express. Se cambio a Hono para tener una API mas ligera, moderna y comoda con TypeScript.

Archivo modificado:

- `apps/api/src/index.ts`

Estado actual de la API:

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = Number(process.env.API_PORT ?? 4000);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on port ${port}`);
});
```

Dependencias actualizadas en `apps/api/package.json`:

- Se agrego `hono`.
- Se agrego `@hono/node-server`.
- Se removio Express.
- Se removio CORS de Express.
- Se removio `@types/express`.

La API compilo correctamente con:

```powershell
npm run build --workspace apps/api
```

## Docker Compose

Se dejo un `docker-compose.yml` con estos servicios:

- `postgres`
- `pgadmin`
- `api`
- `admin`
- `web`

Puertos actuales:

- Web publica: `http://localhost:4321`
- Admin: `http://localhost:3000`
- API: `http://localhost:4000`
- API health: `http://localhost:4000/api/health`
- pgAdmin: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

## PostgreSQL

Se cambio PostgreSQL a version 17:

```yaml
image: postgres:17-alpine
```

Motivo:

El volumen local habia sido inicializado con PostgreSQL 17, pero Compose estaba usando PostgreSQL 16. Eso genero este error:

```text
database files are incompatible with server
The data directory was initialized by PostgreSQL version 17,
which is not compatible with this version 16.14.
```

Solucion aplicada:

- Usar `postgres:17-alpine`.
- En un momento se limpio el volumen local con `docker compose down -v` para iniciar desde cero.

Nota:

`docker compose down -v` borra volumenes, incluyendo la data local de PostgreSQL. Solo debe usarse cuando no importa perder la base local.

## pgAdmin

pgAdmin fallo porque el email inicial era:

```text
admin@nexus.local
```

La imagen actual de pgAdmin valida el dominio y no acepta dominios reservados como `.local`.

Error:

```text
'admin@nexus.local' does not appear to be a valid email address.
The part after the @-sign is a special-use or reserved name.
```

Solucion aplicada:

```yaml
PGADMIN_DEFAULT_EMAIL: admin@nexus.testmail.com
PGADMIN_DEFAULT_PASSWORD: admin123
```

Credenciales actuales de pgAdmin:

```text
Email: admin@nexus.testmail.com
Password: admin123
```

Datos para registrar el servidor PostgreSQL dentro de pgAdmin:

```text
Host: postgres
Port: 5432
Database: nexus
User: postgres
Password: postgres
```

## Problemas encontrados con Docker

### Contenedores con nombres en conflicto

Aparecieron errores como:

```text
Conflict. The container name "/nexus-postgres" is already in use
```

Tambien aparecieron contenedores temporales/huerfanos creados por intentos fallidos de Compose.

Solucion:

```powershell
docker rm -f ID_DEL_CONTENEDOR
```

Tambien se uso:

```powershell
docker compose down --remove-orphans
```

## Problemas encontrados con web y admin

Los contenedores estaban arriba, pero la web no respondia correctamente desde el navegador.

La causa principal fue que Astro estaba escuchando solo en `localhost` dentro del contenedor. En Docker, el servidor debe escuchar en `0.0.0.0`.

Se cambio el script de la web:

```json
"dev": "astro dev --host 0.0.0.0"
```

Tambien se dejo Next explicitamente escuchando en `0.0.0.0`:

```json
"dev": "next dev -H 0.0.0.0"
```

Archivos modificados:

- `apps/nexus-corp-web/package.json`
- `apps/admin-panel-web/package.json`

## Workdir de los contenedores

En `docker-compose.yml`, cada servicio quedo con su `working_dir` correcto:

```yaml
api:
  working_dir: /app/apps/api

admin:
  working_dir: /app/apps/admin-panel-web

web:
  working_dir: /app/apps/nexus-corp-web
```

Esto evito que los contenedores ejecutaran scripts desde la raiz del monorepo y que Turbo intentara levantar servicios equivocados dentro de un mismo contenedor.

## Rutas con mayusculas y minusculas

Se detecto un problema importante por diferencias entre Windows y Linux:

- Windows suele ser tolerante con mayusculas/minusculas.
- Linux dentro de Docker no lo es.

Habia referencias antiguas como:

- `apps/Admin-panel-web`
- `apps/Nexus-Corp-Web`
- `apps/Backend`

Las carpetas reales actuales son:

- `apps/admin-panel-web`
- `apps/nexus-corp-web`
- `apps/api`

Se corrigieron referencias para evitar errores dentro de Docker.

## Comandos utiles

Levantar todo reconstruyendo:

```powershell
docker compose up --build
```

Levantar todo en segundo plano:

```powershell
docker compose up --build -d
```

Levantar sin reconstruir:

```powershell
docker compose up
```

Ver logs:

```powershell
docker compose logs -f
```

Ver estado de servicios:

```powershell
docker compose ps
```

Reiniciar servicios concretos:

```powershell
docker compose restart web admin
```

Bajar contenedores sin borrar volumenes:

```powershell
docker compose down
```

Bajar contenedores y limpiar huerfanos:

```powershell
docker compose down --remove-orphans
```

Bajar contenedores borrando volumenes:

```powershell
docker compose down -v
```

Ver imagenes:

```powershell
docker images
```

Borrar una imagen:

```powershell
docker rmi NOMBRE_O_ID
```

Borrar un contenedor:

```powershell
docker rm -f ID_DEL_CONTENEDOR
```

## Estado final validado

Se logro levantar el stack completo:

- PostgreSQL inicializo correctamente.
- PostgreSQL quedo healthy.
- API respondio con Hono en el puerto `4000`.
- Web Astro quedo disponible en el puerto `4321`.
- Admin Next quedo disponible en el puerto `3000`.
- pgAdmin quedo disponible en el puerto `5050`.

Endpoints importantes:

```text
http://localhost:4321
http://localhost:3000
http://localhost:4000/api/health
http://localhost:5050
```

## Siguiente enfoque

A partir de aqui el foco sera solo la carpeta:

```text
apps/api
```

Siguiente etapa propuesta:

- Ordenar modulos de la API.
- Conectar Drizzle con PostgreSQL.
- Definir schemas.
- Crear rutas por modulo.
- Preparar la API para el futuro panel administrativo.
- Dejar el chatbot con IA para una etapa posterior.
