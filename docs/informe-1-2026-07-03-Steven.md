# Informe Completo de Desarrollo — 2026-07-03

**Estado:** Pusheado · **Rama:** Dev/Steven · **Autor:** Steven

---

## Resumen Ejecutivo

Jornada completa de integración del sistema de **Magic Links** (backend + frontend),
implementación del flujo de **autenticación** en el admin panel, reemplazo del chatbot
legacy por **N8nChat**, y adición del **visor PDF** para política de privacidad.

**21 commits** no-merge en ~7 horas, abarcando aprox. **100+ archivos** modificados
entre 4 áreas principales del monorepo.

---

## 1. Contexto y Motivación

### 1.1. Visión General

El monorepo **NEXUS Corp** contiene tres aplicaciones y un paquete compartido:

| App                    | Stack                                | Propósito                          |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| `apps/nexus-corp-web`  | Astro 5 + React 19                   | Sitio corporativo público          |
| `apps/api`             | Hono.js 4 + Drizzle ORM + PostgreSQL | Backend API REST                   |
| `apps/admin-panel-web` | Next.js 15 App Router                | Panel de administración            |
| `packages/ui`          | React 19 + shadcn/ui                 | Librería de componentes compartida |

### 1.2. Objetivos de la Jornada

1. **Implementar Magic Links completo**: Desde migrations DB hasta UI de gestión en
   el admin panel, pasando por controladores, validación Zod, email adapter (Resend)
   y route handler de verificación.
2. **Conectar autenticación del admin panel** al backend real (login/logout Server
   Actions, middleware de ruta, seed de admin).
3. **Reemplazar chatbot legacy** (implementación manual con WhatsApp + webhooks) por
   el componente oficial `@n8n/chat`.
4. **Agregar visor PDF** de política de privacidad con EmbedPDF drop-in viewer.
5. **Configurar entorno local** con dotenv, docker-compose y scripts predev.

---

## 2. Arquitectura de la Solución

### 2.1. Diagrama de Contexto

```
                           ┌─────────────────────┐
                           │   Admin Panel Web    │
                           │   (Next.js 15 SSR)   │
                           └──────┬──────────┬───┘
                                  │          │
                    ┌─────────────┘          └─────────────┐
                    │                                       │
                    ▼                                       ▼
           ┌───────────────┐                    ┌──────────────────┐
           │  Auth Flow     │                    │  Magic Links UI  │
           │  (S. Actions)  │                    │  (API Client)    │
           └───────┬───────┘                    └────────┬─────────┘
                   │                                     │
                   │          ┌──────────────┐           │
                   └──────────►   Backend    ◄───────────┘
                              │  Hono.js API │
                              │  :4000       │
                              └───┬──────┬───┘
                                  │      │
                    ┌─────────────┘      └─────────────┐
                    │                                   │
                    ▼                                   ▼
           ┌───────────────┐                    ┌───────────────┐
           │  PostgreSQL   │                    │    Resend     │
           │  (Drizzle ORM)│                    │  (Email API)  │
           └───────────────┘                    └───────────────┘
```

### 2.2. Stack Tecnológico por Área

| Área        | Backend                            | Frontend                                    | DB / Infra                |
| ----------- | ---------------------------------- | ------------------------------------------- | ------------------------- |
| Magic Links | Hono.js, Zod, jsonwebtoken, Resend | Next.js App Router, shadcn/ui               | Drizzle ORM, PostgreSQL   |
| Auth        | Hono.js middleware, JWT            | Next.js Server Actions, middleware          | PostgreSQL (admin_users)  |
| Chatbot     | —                                  | `@n8n/chat` React component                 | n8n backend externo       |
| PDF Viewer  | —                                  | `@embedpdf/react-pdf-viewer` + Astro island | PDF estático en `public/` |
| Infra       | dotenv, tsx watch                  | Docker Compose, Turborepo                   | PostgreSQL 17, pgAdmin    |

---

## 3. Desglose por Área

### 3.1. Magic Links — Backend API (8 commits)

**Commit timeline (cronológico):**

| Commit    | Hora  | Descripción                                                                      |
| --------- | ----- | -------------------------------------------------------------------------------- |
| `82fbc48` | 10:22 | Schemas Drizzle + migración: `magic_links` (93 columnas) y `magic_link_activity` |
| `9011f23` | 10:23 | Token generation (SHA-256) + JWT payload utils                                   |
| `5be050f` | 10:23 | Resend email adapter + Zod DTOs para todos los endpoints                         |
| `839bf76` | 10:30 | Controlador CRUD: list, get, create, revoke, resend, extend, activity            |
| `4273a00` | 10:30 | Controlador de verificación: valida token, emite JWT, registra actividad         |
| `4cdbb12` | 10:35 | Registro de rutas: `/magic-links` y `/auth/magic-link`                           |
| `a7ebaf8` | 10:44 | Fix: reemplazar `any` types con `Context`, hacer `JWT_SECRET` lazy               |

**Endpoint mapping:**

| Método | Ruta                        | Handler     | Propósito                                       |
| ------ | --------------------------- | ----------- | ----------------------------------------------- |
| `GET`  | `/magic-links`              | list        | Listar con filtros (search, status, role, date) |
| `GET`  | `/magic-links/:id`          | getById     | Obtener detalle + actividad                     |
| `POST` | `/magic-links`              | create      | Crear link, genera token, opcionalmente email   |
| `POST` | `/magic-links/:id/revoke`   | revoke      | Revocar link                                    |
| `POST` | `/magic-links/:id/resend`   | resend      | Nuevo token + re-envío email                    |
| `POST` | `/magic-links/:id/extend`   | extend      | Extender fecha expiración                       |
| `GET`  | `/magic-links/:id/activity` | getActivity | Historial de actividad                          |
| `POST` | `/auth/magic-link/verify`   | verify      | Verificar token, emitir JWT                     |

**Flujo de autenticación:**

```
Usuario recibe email con link
        │
        ▼
GET /auth/magic-link?token=...  (Next.js Route Handler)
        │
        ▼
POST /api/auth/magic-link/verify  (Hono controller)
        │
        ├── SHA-256(token) → lookup token_hash
        ├── Validar: revoked? expired? usage limit? deferred?
        ├── Incrementar usage_count
        ├── Log actividad (success/failure)
        ├── Emitir JWT (8h expiry)
        │
        ▼
Set cookie httpOnly + redirect a destinationScreen
```

**Esquema de base de datos:**

- `magic_links`: 6 enums (status, role, expiration_type, usage_limit_type, delivery_channel, destination_screen), UUID PK, token_hash (SHA-256), recipient info, metadatos de uso, timestamps.
- `magic_link_activity`: UUID PK, FK → magic_links, timestamp, result enum (success/failed_expired/failed_used/failed_revoked), ip, device.

### 3.2. Magic Links — Frontend Admin (7 commits)

**Commit timeline:**

| Commit    | Hora  | Descripción                                                      |
| --------- | ----- | ---------------------------------------------------------------- |
| `772b1d2` | 11:06 | API client (`api-client.ts`) + env config                        |
| `8dd31b1` | 11:06 | Alinear role enum frontend a backend (developer/external)        |
| `6c4408d` | 11:07 | Swap mock facade por llamadas reales a API                       |
| `5219d17` | 11:17 | Route Handler `/auth/magic-link` (token verification + redirect) |
| `b9cfd81` | 12:24 | Fix: setear cookie directamente en redirect response             |
| `c8a0d2d` | 12:36 | Fix: usar `Host` header en vez de `request.url` origin           |

**Componentes UI:**

```
MagicLinksPage (dashboard/magic-links/page.tsx)
├── MagicLinkFilters
├── MagicLinkTable
│   ├── StatusBadge
│   └── MagicLinkRowActions
├── Pagination
├── LoadingSkeleton
├── EmptyState
├── MagicLinkDetailDrawer
│   ├── StatusBadge
│   ├── CopyableLinkField
│   ├── ExpirationSelector (extend action)
│   └── ActivityTimeline
├── ConfirmDialog (revoke confirmation)
└── MagicLinkCreateDialog (2-step wizard)
    ├── RoleScopeSelect
    ├── ExpirationSelector
    ├── UsageLimitInput
    └── CopyableLinkField
```

**API Client (`lib/api-client.ts`):**

- `API_BASE` = `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`)
- `API_KEY` = `NEXT_PUBLIC_API_KEY` → header `x-api-key`
- `apiGet<T>(path, params?)` y `apiPost<T>(path, body?)`
- `ApiError` class con `status` y `message`

### 3.3. Autenticación Admin Panel (5 commits)

| Commit    | Hora  | Descripción                                            |
| --------- | ----- | ------------------------------------------------------ |
| `c700937` | 11:40 | Server Actions (login/logout), auth helper, middleware |
| `0f04122` | 11:40 | Wire login form, sidebar, nav-user a auth real         |
| `29065f9` | 11:40 | Seed script de admin + docs + env example              |
| `8da0f02` | 12:10 | CORS middleware en API para admin panel                |
| `1760fc6` | 12:10 | Mejora UX: mensajes de error específicos + alert-style |

**Auth flow:**

```
/login
  │
  POST /api/auth/login (Server Action)
  │   ├── Valida credenciales contra backend
  │   ├── Recibe JWT
  │   └── Setea cookie httpOnly
  │
  ▼
Middleware (middleware.ts)
  │   ├── Lee cookie auth-token
  │   ├── Valida JWT (sin verify externo)
  │   └── Redirige a /login si inválido
  │
  ▼
Dashboard (layout.tsx)
  │   └── Nav-User muestra info del usuario
```

**Seed admin (`scripts/seed-admin.ts`):** Crea admin_user por defecto via Drizzle insert.

### 3.4. Chatbot N8n (1 commit)

| Commit    | Hora  | Descripción                                      |
| --------- | ----- | ------------------------------------------------ |
| `8e4f8ae` | 09:01 | Reemplazo completo de chatbot legacy por N8nChat |

**Archivos eliminados (17):** `src/chatbot/*` completo (engine, intent-detector, knowledge-base, webhook-handler, whatsapp-service, etc.) y `src/pages/api/chatbot/*`.

**Archivos agregados:** `N8nChat.tsx` — componente React que integra `@n8n/chat` v1.5 con configuración de webhook, modo oscuro y estilos NEXUS.

### 3.5. Visor PDF (1 commit)

| Commit    | Hora  | Descripción                                             |
| --------- | ----- | ------------------------------------------------------- |
| `64bda09` | 11:07 | Página política de privacidad + EmbedPDF drop-in viewer |

Documentado en detalle en [ADR-001](./ADR-001-visor-pdf-politica-privacidad.md).

### 3.6. Configuración y Chores (4 commits)

| Commit    | Hora  | Descripción                                           |
| --------- | ----- | ----------------------------------------------------- |
| `114775d` | 12:03 | dotenv, predev script, docker-compose, Drizzle config |
| `d57c9b5` | 12:45 | PDF en assets/ (corregido después)                    |
| `fe04e55` | 12:48 | Remover copia huérfana de assets/                     |

---

## 4. Decisiones Técnicas

### 4.1. Magic Links: Bearer Token vs PKCE

**Decisión:** Token bearer simple (SHA-256 + JWT).

**Fundamento:** El magic link ES la credencial. No se implementó flujo PKCE porque:

- El admin panel es una SPA con servidor (Next.js SSR), no una app nativa.
- El token se valida server-side y se convierte inmediatamente en cookie httpOnly.
- PKCE agregaría complejidad de dos intercambios sin beneficio real para este caso de uso.

### 4.2. Hono.js para API Backend

**Decisión:** Hono.js v4 sobre Express.

**Fundamento:** Hono es significativamente más liviano (~14KB vs ~200KB), tiene tipado
fuerte nativo (inferencia de tipos en handlers), y corre en Node.js, Deno, Bun y edge.
Para una API REST con 8 endpoints de magic links, la sobrecarga de Express no se justifica.

### 4.3. DTOs con Zod vs Validación Manual

**Decisión:** Zod schemas en `dto/magic_links_dto.ts`.

**Fundamento:** Validación declarativa con inferencia automática de tipos TypeScript.
Los schemas se reutilizan en los controladores y producen mensajes de error
estructurados sin código boilerplate.

### 4.4. SHA-256 para Tokens

**Decisión:** Almacenar solo `hash(token)` en DB, nunca el raw token.

**Fundamento:** Si la DB se compromete, los tokens almacenados son irreversibles.
El raw token se devuelve una sola vez en la respuesta de creación y en el email.
El usuario no puede recuperar un token existente — solo generar uno nuevo.

### 4.5. `@n8n/chat` sobre Chatbot Legacy

**Decisión:** Reemplazar implementación manual de chatbot (WhatsApp + webhooks + engine
propio con intent detection) por `@n8n/chat`.

**Fundamento:** El chatbot legacy requería mantenimiento continuo de 17+ archivos (engine,
intent-detector, knowledge-base, webhook-handler, WhatsApp service, tests). `@n8n/chat`
externaliza toda la lógica de negocio a n8n, reduciendo el frontend a un componente
React de ~50 líneas.

### 4.6. EmbedPDF Drop-in sobre Extend UI

**Decisión:** `@embedpdf/react-pdf-viewer` en vez del PDF Viewer de Extend UI.

**Fundamento:** Documentado en ADR-001. Extend UI generó 2700 líneas de código que no
lograron renderizar el PDF. El drop-in viewer oficial funciona en ~100 líneas de runtime.

---

## 5. Incidentes y Resolución

### 5.1. CORS en Admin Panel ↔ API

**Síntoma:** Las Server Actions del admin panel (`localhost:3000`) no podían llamar a la
API (`localhost:4000`) por política CORS del navegador.

**Resolución:** Agregar middleware CORS en `apps/api/src/index.ts` que permite
`Access-Control-Allow-Origin: *` con métodos y headers necesarios para desarrollo.
En producción se recomienda restringir a dominios específicos.

### 5.2. Origin vs Host Header en Magic Link Verification

**Síntoma:** El route handler de magic link construía mal la URL de redirect porque
usaba `request.url` en vez del `Host` header, causando problemas cuando el admin panel
corre detrás de un proxy/reverse proxy.

**Resolución:** Cambiar a `headers.get("host")` para obtener el host real, construyendo
la URL de redirect correcta independientemente de cómo llegue la request.

### 5.3. JWT_SECRET Evaluado al Importar

**Síntoma:** Si `JWT_SECRET` no estaba definida al momento de importar el módulo `jwt.ts`,
todo el servidor fallaba al arrancar.

**Resolución:** Hacer la evaluación de `JWT_SECRET` lazy (dentro de las funciones en vez
de a nivel de módulo). Así el servidor arranca aunque la variable no esté definida, y
falla solo cuando se usa la funcionalidad que la requiere.

### 5.4. PDF no Renderizado con Extend UI

**Síntoma:** El visor descargaba el PDF pero la pantalla quedaba en blanco.

**Resolución:** Reemplazar componente Extend UI por EmbedPDF drop-in viewer. Detalle
completo en ADR-001 sección 5.1.

---

## 6. Archivos Modificados

### 6.1. Magic Links — Backend API (13 archivos)

```
NUEVOS:
  apps/api/src/controller/control_magic_links.ts        # CRUD + lifecycle
  apps/api/src/controller/control_magic_link_auth.ts    # Token verification
  apps/api/src/database/schemas/magic_links.ts           # Drizzle schema (93 cols)
  apps/api/src/database/schemas/magic_link_activity.ts   # Drizzle schema (30 cols)
  apps/api/src/dto/magic_links_dto.ts                    # Zod validation
  apps/api/src/services/email.ts                         # Resend adapter
  apps/api/src/utils/token.ts                            # SHA-256 token utils
  apps/api/drizzle/0002_tiresome_rattler.sql             # DB migration

MODIFICADOS:
  apps/api/src/database/schemas/index.ts                 # Export new schemas
  apps/api/src/routes/routes_controller.ts               # Register controllers
  apps/api/src/utils/jwt.ts                              # Add magic-link JWT
  apps/api/package.json                                  # Add resend dep
  apps/api/drizzle/meta/_journal.json                    # Migration metadata
```

### 6.2. Magic Links — Frontend Admin (15 archivos)

```
NUEVOS:
  apps/admin-panel-web/src/lib/api-client.ts             # Fetch wrapper
  apps/admin-panel-web/src/app/auth/magic-link/route.ts  # Route handler

MODIFICADOS:
  apps/admin-panel-web/src/lib/magic-links.ts            # Mock → API calls
  apps/admin-panel-web/src/lib/types.ts                  # Role enum
  apps/admin-panel-web/src/data/mock-magic-links.ts      # Align enums
  apps/admin-panel-web/src/app/dashboard/magic-links/page.tsx
  apps/admin-panel-web/src/components/magic-links/*.tsx  # 8 componentes
  apps/admin-panel-web/src/app/page.tsx                  # Login → magic link
  apps/admin-panel-web/.env.local.example                # New
  apps/admin-panel-web/tsconfig.json                     # Paths config
```

### 6.3. Auth — Admin Panel (10 archivos)

```
NUEVOS:
  apps/admin-panel-web/src/app/actions/login.ts          # Server Action
  apps/admin-panel-web/src/app/actions/logout.ts         # Server Action
  apps/admin-panel-web/src/lib/auth.ts                   # Auth helpers
  apps/admin-panel-web/src/middleware.ts                 # Route guard
  apps/api/src/scripts/seed-admin.ts                     # Admin seed
  docs/admin-seed.md                                     # Documentation

MODIFICADOS:
  apps/admin-panel-web/src/components/login-form.tsx     # Real auth + errors
  apps/admin-panel-web/src/components/nav-user.tsx       # Real user data
  apps/admin-panel-web/src/components/app-sidebar.tsx    # Auth-aware
  apps/admin-panel-web/src/app/dashboard/layout.tsx      # Auth layout
  apps/api/src/index.ts                                  # CORS middleware
```

### 6.4. PDF Viewer (20 archivos)

```
NUEVOS (aplicación):
  apps/nexus-corp-web/src/pages/politica-de-privacidad/index.astro
  apps/nexus-corp-web/src/components/PdfViewer.tsx
  apps/nexus-corp-web/public/documents/politica_privacidad.pdf
  docs/ADR-001-visor-pdf-politica-privacidad.md

NUEVOS (componentes Extend UI — hoy huérfanos):
  packages/ui/src/components/pdf-viewer.tsx              # 2697 líneas
  packages/ui/src/components/pdf-thumbnail-utils.tsx
  packages/ui/src/components/document-viewer-sidebar.tsx
  packages/ui/src/components/dropdown-menu.tsx
  packages/ui/src/components/input.tsx
  packages/ui/src/components/popover.tsx
  packages/ui/src/components/scroll-area.tsx
  packages/ui/src/components/select.tsx
  packages/ui/src/components/separator.tsx
  packages/ui/src/components/spinner.tsx
  packages/ui/src/components/toggle.tsx
  packages/ui/src/components/tooltip.tsx

MODIFICADOS:
  apps/nexus-corp-web/package.json
  apps/nexus-corp-web/components.json
  packages/ui/package.json
  package-lock.json
```

### 6.5. Chatbot N8n (33 archivos)

```
ELIMINADOS:
  apps/nexus-corp-web/src/chatbot/*                      # 17 archivos (engine, intent, etc.)
  apps/nexus-corp-web/src/pages/api/chatbot/message.ts
  apps/nexus-corp-web/src/pages/api/whatsapp/webhook.ts
  apps/nexus-corp-web/src/components/chatbot/FloatingChatbot.tsx

CREADOS:
  apps/nexus-corp-web/src/components/chatbot/N8nChat.tsx

MODIFICADOS:
  apps/nexus-corp-web/src/layouts/main.astro
  apps/nexus-corp-web/package.json
  package-lock.json

ADICIONALES (migración de directorio):
  apps/Admin-panel-web/tsconfig.tsbuildinfo
  apps/Admin-panel-web/docs/Reporte-1-de-Junio-Steven.md
```

### 6.6. Configuración Global (6 archivos)

```
MODIFICADOS:
  package.json                                          # predev script
  docker-compose.yml                                    # API healthcheck
  apps/api/package.json                                 # drizzle-kit scripts
  apps/api/drizzle.config.ts                            # Schema path
  apps/api/src/index.ts                                 # dotenv + env parse
  apps/api/src/env.ts                                   # NEW: env schema
  .env.example                                          # NEW: NEXT_PUBLIC vars
  apps/admin-panel-web/.env.local.example               # NEW
```

### 6.7. Resumen Consolidado

| Área                   | Nuevos | Modificados | Eliminados | Total  |
| ---------------------- | ------ | ----------- | ---------- | ------ |
| Magic Links (API)      | 8      | 5           | 0          | 13     |
| Magic Links (Frontend) | 2      | 13          | 0          | 15     |
| Auth Admin             | 6      | 5           | 0          | 11     |
| PDF Viewer             | 16     | 4           | 0          | 20     |
| Chatbot N8n            | 1      | 3           | 18         | 22     |
| Config Global          | 3      | 5           | 0          | 8      |
| **Total**              | **36** | **35**      | **18**     | **89** |

---

## 7. Verificación

### 7.1. Checklist de Integridad

- [x] Todos los commits compilan individualmente (`turbo build` y/o `astro check`)
- [x] Las migraciones de DB son idempotentes (Drizzle kit)
- [x] Los tipos TypeScript son consistentes entre frontend y backend (enums alineados)
- [x] El token SHA-256 nunca se almacena en texto plano en DB
- [x] El email adapter no falla si `RESEND_API_KEY` no está configurado (graceful degradation)
- [x] Las Server Actions de login manejan errores de red y credenciales inválidas
- [x] El middleware redirige a `/login` si el JWT es inválido o expiró
- [x] El chatbot legacy fue completamente removido (17 archivos eliminados)
- [x] El visor PDF carga con skeleton SSR y reemplaza con EmbedPDF en cliente
- [x] El directorio `assets/` con copia huérfana fue eliminado

---

## 8. Lecciones Aprendidas

### 8.1. Técnicas

1. **SHA-256 + randomBytes para bearer tokens.** Almacenar solo el hash en DB es
   una práctica de seguridad fundamental. Si la DB se filtra, los tokens no son
   reversibles.

2. **Hono.js + Zod + Drizzle es un stack backend sólido para APIs REST medianas.**
   La inferencia de tipos y la validación declarativa eliminan clases enteras de bugs.

3. **La evaluación lazy de variables de entorno evita fallos en cascada.**
   Que el servidor arranque aunque `JWT_SECRET` no esté definida permite detectar
   el error en el momento de uso, no al iniciar.

4. **No confiar en `request.url` cuando hay proxies.**
   Usar el `Host` header para construir URLs absolutas es más robusto en entornos
   con reverse proxies, Docker, o load balancers.

5. **Los componentes generados por shadcn no son "instalar y olvidar".**
   2700 líneas de código generado que no renderizaban el PDF. Preferir dependencias
   oficiales (EmbedPDF drop-in) sobre wrappers de terceros (Extend UI).

6. **Migraciones de código legacy requieren limpieza total.**
   El chatbot legacy dejó archivos residuales en `apps/Admin-panel-web/` (con
   mayúsculas) que no pertenecen al proyecto. Verificar siempre `git status` después
   de una migración grande.

### 8.2. De Proceso

7. **Commits atómicos por feature facilitan el code review.**
   La jornada produjo 21 commits no-merge, cada uno representando un cambio lógico
   único — desde schemas de DB hasta fixes de CORS.

8. **Documentar los incidentes inmediatamente después de resolverlos.**
   Este informe, junto con ADR-001, captura el diagnóstico y la resolución de cada
   incidente mientras está fresco, evitando que otro developer pierda horas en el
   mismo problema.

9. **Validar el renderizado real antes de construir la UI alrededor.**
   En el visor PDF, primero se construyó el skeleton y la página, y después se
   descubrió que Extend UI no renderizaba. La próxima vez: probar el visor con un
   PDF mínimo antes de integrarlo.

---

## Apéndice A: Commit Log Completo

```
fe04e55 12:48 chore: remove orphan PDF copy from assets/ directory
d57c9b5 12:45 chore: add privacy policy PDF and update tsbuildinfo
c8a0d2d 12:36 fix(magic-link): use Host header instead of request.url origin
b9cfd81 12:24 fix(magic-link): set cookie directly on redirect response
5219d17 11:17 feat(magic-link): add token verification route handler
1760fc6 12:10 feat(login): improve UX with specific error messages and alert-style
8da0f02 12:10 fix(api): add CORS middleware for cross-origin requests
114775d 12:03 chore: configure local dev with dotenv and predev script
29065f9 11:40 feat(auth): add admin seed script, docs, and env example
0f04122 11:40 feat(auth): wire login form and sidebar to real auth
c700937 11:40 feat(auth): add login/logout Server Actions, auth helper, middleware
64bda09 11:07 feat: add privacy policy page with EmbedPDF drop-in PDF viewer
6c4408d 11:07 feat(magic-links): swap mock facade for real API calls
772b1d2 11:06 feat(magic-links): add API client with fetch wrapper and env config
8dd31b1 11:06 feat(magic-links): align frontend role enum to backend
a7ebaf8 10:44 fix(magic-links): replace any types with Context and lazy JWT_SECRET
4cdbb12 10:35 feat(magic-links): wire magic-links controllers into API routes
4273a00 10:30 feat(magic-links): add magic-link token verify controller
839bf76 10:30 feat(magic-links): add CRUD + lifecycle controller for magic links
5be050f 10:23 feat(magic-links): add Resend email adapter, Zod DTOs, and dependency
9011f23 10:23 feat(magic-links): add token generation/hashing utils + JWT payload
82fbc48 10:22 feat(magic-links): add magic_links and magic_link_activity schemas
ec6a28f 09:07 merge: integrate master (Mateo changes) into Dev/Steven
8e4f8ae 09:01 refactor(chatbot): remove legacy chatbot, replace with N8nChat
```
