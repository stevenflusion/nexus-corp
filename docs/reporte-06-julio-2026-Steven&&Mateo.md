# Informe de Desarrollo NEXUS Corp — Julio 2026

**Fecha:** 2026-07-06  
**Autores:** Steven Flusion & Mateo Velasco  
**Rama de trabajo:** Dev/Steven, Dev/Mateo  
**Estado:** Todo mergeado a `master` y subido

---

## 1. Resumen Ejecutivo

Este informe consolida el trabajo de ambos desarrolladores durante la primera semana de julio 2026.

- **Mateo Velasco** construyó el **100% del backend API** y la **infraestructura base** del proyecto NEXUS Corp. Su trabajo abarca desde la configuración Docker inicial hasta el servicio de Azure Blob Storage, pasando por la base de datos PostgreSQL con Drizzle ORM, todos los controladores CRUD, el sistema de autenticación, y la integración de la API con el frontend público.

- **Steven Flusion** implementó el **ciclo de vida completo de sesiones Magic Link** en el panel de administración, corrigió bugs críticos de seguridad y UX sobre la base construida por Mateo, y entregó el dashboard de leads con cotizaciones y notas.

| Desarrollador | Áreas cubiertas                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mateo**     | Docker, PostgreSQL, Drizzle ORM, 7 controladores CRUD, autenticación JWT, middleware, DTOs, servicios, Azure Blob Storage, integración web-api |
| **Steven**    | Magic Link session lifecycle, countdown UI, revocación instantánea, cross-tab sync, email service, leads dashboard, frontend admin panel       |

---

## 2. Contribuciones de Mateo Velasco — Backend e Infraestructura

### 2.1. Timeline de Ramas

Mateo trabajó en 8 ramas secuenciales mergeadas progresivamente a `master`:

```
docker-integracion
    │
    ▼
services-database
    │
    ▼
services-api
    │
    ▼
integration-web-api
    │
    ▼
services-for-admin
    │
    ▼
pruebas-ok
    │
    ▼
azureStorage
```

| Branch                         | Merge Commit | PR            |
| ------------------------------ | ------------ | ------------- |
| `mateo/dev/docker-integracion` | `56bec50`    | PR #4         |
| `mateo/dev/services-api`       | `3120f3a`    | PR #5         |
| `mateo/dev/pruebas-ok`         | `acfd110`    | PR #8         |
| `mateo/dev/azureStorage`       | `94abf37`    | Merge directo |

### 2.2. Infraestructura Docker (rama docker-integracion)

| Entregable              | Detalle                                         |
| ----------------------- | ----------------------------------------------- |
| `docker-compose.yml`    | 5 servicios: postgres, pgAdmin, api, admin, web |
| `Dockerfile.*.dev`      | Multi-stage para api, admin y web               |
| `apps/api/src/index.ts` | Entry point Hono.js (reemplazó Express)         |

**Decisiones clave:**

- **Hono.js sobre Express:** ~14KB vs ~200KB, tipado fuerte nativo, compatible con Node/Bun/Edge.
- **PostgreSQL 17** con pgAdmin para gestión visual.
- **Normalización de carpetas:** `Admin-panel-web` → `admin-panel-web`, `Nexus-Corp-Web` → `nexus-corp-web` (Windows es case-insensitive, Linux Docker no).
- **Binding `0.0.0.0` explícito:** Para accesibilidad desde fuera del contenedor en cualquier SO.

### 2.3. Base de Datos (rama services-database)

**Schemas definidos con Drizzle ORM:**

| Tabla           | Columnas clave                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `leads`         | id_leads (serial PK), name_leads, email_leads, phone_leads (unique), city_leads, status_leads (enum), source_leads (enum), monthly_family_income (decimal), coments_optionals_lead, accepted_terms_lead, accepted_terms_at, accepted_terms_ip |
| `quotes`        | id_quotes (serial PK), lead_id (FK), product_quotes (enum), requested_amount_quotes, down_payment_quotes, term_months_quotes, annual_interest_rate_quotes, monthly_payment_quotes, contact_preference_quotes (enum), result_status_quotes     |
| `lead_notes`    | id_lead_notes (serial PK), manager_lead_notes, note_lead_notes, id_leads (FK)                                                                                                                                                                 |
| `admin_users`   | id_admin_users (serial PK), name_admin_users, email_admin_users, password_admin_users, active                                                                                                                                                 |
| `audit_logs`    | id_audit_logs (serial PK), action, entity, entity_id, user_id, details, ip_address, created_at                                                                                                                                                |
| `credit_scores` | id (serial PK), lead_id (FK), status (enum: PENDING/UNDER_REVIEW/APPROVED/REJECTED/CANCELLED), contract_url, selfie_url, reviewed_by_magic_link, notes, created_at, updated_at                                                                |

**Archivos:**

- `apps/api/drizzle.config.ts`
- `apps/api/drizzle/0000_wooden_sally_floyd.sql` — Migración inicial
- `apps/api/src/database/database.ts` — Conexión PostgreSQL
- `apps/api/src/database/schemas/*`

### 2.4. API Backend (rama services-api)

**Controladores (7):**

- `control_adm.ts` — CRUD admin_users
- `control_auth.ts` — Autenticación JWT (221 líneas)
- `control_lead.ts` — CRUD leads + status updates
- `control_lead_notes.ts` — CRUD notas de seguimiento
- `control_quote.ts` — CRUD cotizaciones + `POST /quotes/with-lead`
- `control_audit_logs.ts` — Registro de auditoría
- `control_credit_scores.ts` — Módulo Credit Scores (182 líneas)

**DTOs (7 archivos):**

- `admin_users_dto.ts`, `authDTO.ts`, `leadDTO.ts`, `lead_notesDTO.ts`, `quotesDTO.ts`, `quotes_whit_leadDTO.ts`, `audit_logsDTO.ts`, `credit_scores.dto.ts`

**Middleware:**

- `apps/api/src/middleware/auth.ts` — Validación JWT
- `apps/api/src/middleware/api_key_middleware.ts` — Protección con header `x-api-key`

**Utilidades:**

- `apps/api/src/utils/crud.ts` — CRUD genérico (getAll, getById, createOne, updateById, deleteById, listWithFilters, getByField)
- `apps/api/src/utils/crypting.ts` — AES-256-GCM para passwords
- `apps/api/src/utils/jwt.ts` — Generación y validación de JWT
- `apps/api/src/utils/audit.ts` — Helper para logging de auditoría
- `apps/api/src/utils/request.ts` — Helper para obtener IP del cliente

**Servicios:**

- `apps/api/src/services/quotes_services.ts` — `createQuoteWithLead` (lead + quote atómico)
- `apps/api/src/services/leads_services.ts` — `getAllLeadsWithQuotes()` (leftJoin + agrupación)
- `apps/api/src/services/credit_scores_services.ts` — Lógica de negocio Credit Scores

**Rutas:**

- `apps/api/src/routes/routes_controller.ts` — Router central Hono

### 2.5. Integración Web-API (rama integration-web-api)

- `apps/nexus-corp-web/src/components/QuoteWizard.tsx` — Reescritura mayor (436 líneas). Ahora comunica con el backend vía API en vez de cálculo client-side puro.
- `apps/nexus-corp-web/src/pages/api/quotes-with-lead.ts` — Endpoint proxy que reenvía al backend.
- `apps/nexus-corp-web/src/pages/api/contact.ts` — Actualizado para usar la API.
- `apps/nexus-corp-web/src/pages/api/webinar-registration.ts` — Actualizado.

**Flujo:**

```
QuoteWizard (React)
    │
    ▼
POST /api/quotes-with-lead (Next.js/Astro)
    │
    ▼
POST /api/quotes/with-lead (Hono)
    │
    ├── sanitizeCreateQuoteWithLeadRequest()
    ├── quotesService.createQuoteWithLead()
    │   ├── Busca lead por teléfono (phone_leads unique)
    │   ├── Si existe → reutiliza lead_id
    │   ├── Si no existe → crea nuevo lead (source="quote", status="new")
    │   └── Crea cotización anclada al lead
    └── Devuelve { lead_id, isNewLead, quote }
```

### 2.6. Servicios para Admin (rama services-for-admin)

- Campos `accepted_terms_lead`, `accepted_terms_at`, `accepted_terms_ip` en schema `leads`.
- `apps/api/src/services/leads_services.ts` — `getAllLeadsWithQuotes()`.
- `docs/contrato-leads-quotes.md` — Contrato profesional de API (7 endpoints documentados).

### 2.7. AcceptTerms y Pruebas (rama pruebas-ok)

Wireado `acceptTerms` a través de todos los endpoints web:

1. Usuario marca checkbox en QuoteWizard.
2. Frontend envía `acceptedTerms: true` + IP.
3. Backend almacena: `accepted_terms_lead = true`, `accepted_terms_at = NOW()`, `accepted_terms_ip = clientIP`.
4. Admin tiene trazabilidad legal completa.

### 2.8. Azure Blob Storage (rama azureStorage)

- `apps/api/src/services/azure/azure_services.ts` — Azure Blob Storage client con lazy initialization, subida de archivos con streams, generación de SAS URLs.
- `apps/api/src/controller/control_credit_scores.ts` — Endpoints para upload de contratos y selfies.
- `docs/servicioAzureStorage.md` — Guía completa.
- Dependencia: `@azure/storage-blob`.

---

## 3. Contribuciones de Steven — Magic Link, Session Lifecycle y Frontend Admin

### 3.1. Qué se entregó

| Funcionalidad                               | Estado | Detalle                                                                              |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Temporizador visible en sesión Magic Link   | ✅     | Countdown `H:MM:SS` en header derecho, con icono de reloj                            |
| Cierre de sesión por expiración             | ✅     | Sonner toast "tiempo superado", redirect automático                                  |
| Revocación instantánea                      | ✅     | Admin revoca → sesión cierra en ≤30s con toast "link revocado"                       |
| Sync entre pestañas                         | ✅     | BroadcastChannel + storage fallback para logout instantáneo en todas las tabs        |
| Cookie `magic-link-exp`                     | ✅     | non-httpOnly, SameSite=Strict, alineada con la expiración real del link              |
| Endpoint `GET /auth/magic-link/session`     | ✅     | Valida token JWT contra PostgreSQL, devuelve `{valid, reason?, expiresAt?}`          |
| Fix bug "tiempo superado" inmediato         | ✅     | El POST /verify marcaba el link como "used" y GET /session lo invalidaba al instante |
| Email de Magic Link funcional               | ✅     | Resend API key corregida en root .env + logs de debug                                |
| Limpieza de datos de prueba                 | ✅     | Truncate de `magic_links` y `magic_link_activity`                                    |
| UI — temporizador agrandado y reposicionado | ✅     | De sidebar footer a header superior derecho, con icono `ClockIcon`                   |

### 3.2. Problemas resueltos

1. **Sin temporizador:** El usuario no veía cuánto tiempo le quedaba. El link podía vencerse en 1h y el usuario seguía dentro del dashboard sin saberlo.
2. **Revocación sin efecto:** Cuando el administrador revocaba un link, la base de datos cambiaba a `status = "revoked"`, pero el JWT en la cookie `auth-token` seguía siendo aceptado. El usuario nunca se enteraba.
3. **Mensajes solo en login:** Los errores `expired`, `revoked`, `used` solo aparecían como banner en la página de login. Si el usuario ya estaba dentro del dashboard, no había forma de notificarle.
4. **Sidebar mostraba "Invitado":** Los usuarios de Magic Link tenían un JWT con `{token_id, role, scopeId}`, pero `getAuthUser()` esperaba `{id_admin_users, name_admin_users, email_admin_users}`, así que devolvía `null`.
5. **Bug crítico:** Al usar un link de un solo uso (`single`), el `POST /verify` lo marcaba como `status = "used"` inmediatamente. El siguiente poll de `GET /session` lo invalidaba, mostrando **"tiempo superado"** a los pocos segundos de entrar.

### 3.3. Arquitectura de la Solución

```
┌────────────────────────────────────────────────────────────────────┐
│                    Admin crea Magic Link (1h)                       │
│                          ↓                                          │
│              POST /magic-links (Hono + Drizzle)                    │
│              Guarda en PostgreSQL: id, expirationDate, status        │
└─────────────────────────┬────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│              Usuario hace click en el link /auth/magic-link?token=   │
│                          ↓                                          │
│              Next.js Route Handler: app/auth/magic-link/route.ts    │
│              Proxies a POST /auth/magic-link/verify                 │
│              Backend devuelve: {token, expiresAt}                    │
│              Frontend setea dos cookies:                              │
│                • auth-token (httpOnly, JWT con token_id, role, ...) │
│                • magic-link-exp (non-httpOnly, ISO8601 expiresAt)  │
│                          ↓                                          │
│              Redirect a /dashboard                                   │
└─────────────────────────┬────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│                    Dashboard Layout (Next.js App Router)            │
│                                                                     │
│   SessionMonitorProvider (React Context + Client Component)        │
│   ├── Lee magic-link-exp de document.cookie                         │
│   ├── Inicia countdown de 1 segundo → formatea H:MM:SS             │
│   ├── Pollea GET /api/auth/magic-link/session cada 30s              │
│   │      ↓                                                          │
│   │   Route Handler lee auth-token → proxies a API con Bearer      │
│   │      ↓                                                          │
│   │   API valida token_id vs PostgreSQL → {valid, reason?, expiresAt?}│
│   │                                                                 │
│   ├── Si valid=false → sonner toast + logoutAction + BroadcastChannel│
│   │   • reason="revoked" → toast: "link revocado"                  │
│   │   • reason="expired" → toast: "tiempo superado"                 │
│   │                                                                 │
│   └── BroadcastChannel("magic-link-session")                       │
│       ├─ Primary: BroadcastChannel (Chrome, Firefox, Edge)         │
│       └─ Fallback: storage event (Safari, browsers sin BC)         │
│                                                                     │
│   SessionCountdown (Badge + cva)                                     │
│   ├── Rendered en header superior derecho (ml-auto)                  │
│   ├── Format: H:MM:SS con icono ClockIcon                           │
│   ├── Variantes por cva:                                            │
│   │   • default (>5min) → bg-primary                               │
│   │   • warning (1-5min) → bg-muted-foreground                     │
│   │   • danger (<1min) → bg-destructive + animate-pulse              │
│   └── Hidden para usuarios admin (no magic-link-exp cookie)        │
│                                                                     │
└─────────────────────────┬────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│              Admin revoca el link desde /dashboard/magic-links       │
│                          ↓                                          │
│              POST /magic-links/:id/revoke → DB status = "revoked"   │
│                          ↓                                          │
│              Siguiente poll (≤30s) devuelve valid=false, reason="revoked"│
│              → Toast "link revocado", logoutAction, broadcast a tabs │
│              → Todas las tabs se cierran instantáneamente            │
└────────────────────────────────────────────────────────────────────┘
```

### 3.4. Decisiones de Diseño Clave

| Decisión                                           | Alternativa Rechazada               | Fundamento                                                                                                                                              |
| -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Polling HTTP cada 30s**                          | WebSocket / SSE                     | No hay infra de real-time. WebSocket requiere conexiones persistentes. Polling es stateless y suficiente para 30s de latencia.                          |
| **Cookie `magic-link-exp` (non-httpOnly)**         | Parsear JWT en cliente              | El JWT está en cookie httpOnly, inaccesible desde JS. Una cookie separada con solo la fecha de expiración evita exponer secretos.                       |
| **BroadcastChannel + storage fallback**            | Solo polling                        | Sin BC, una pestaña esperaría hasta 30s para enterarse de una revocación. BC permite logout instantáneo.                                                |
| **Unión discriminada `AuthUser \| MagicLinkUser`** | Sintetizar magic-link como AuthUser | `AuthUser` tiene campos que no existen en magic-link (`id_admin_users`, `email_admin_users`). La unión con `kind` discriminant previene bugs.           |
| **GET /session no invalida por "used"**            | Mantener `used` como inválido       | Un link "used" significa "ya fue usado para loguearse", no "la sesión es inválida". Invalidar por "used" causaba el bug de "tiempo superado" inmediato. |

### 3.5. Backend — Archivos Modificados

#### `apps/api/src/utils/jwt.ts`

Nuevo helper `verifyMagicLinkToken()` para verificar JWTs de Magic Link, retornando `MagicLinkJwtPayload` (`token_id`, `role`, `scopeId`, `destinationScreen`).

#### `apps/api/src/controller/control_magic_link_auth.ts` — `POST /verify` y `GET /session`

**POST /verify (después):**

- Devuelve `expiresAt`: `min(JWT exp 8h, DB expirationDate)`.
- Sigue marcando como "used" para prevenir re-uso, pero el `GET /session` ya no considera "used" como inválido.

**GET /session (nuevo):**

```typescript
GET /auth/magic-link/session
Authorization: Bearer <magic-link-jwt>
→ 200 { valid: true, expiresAt: "2026-07-06T18:00:00.000Z" }
→ 200 { valid: false, reason: "revoked" }
→ 200 { valid: false, reason: "expired" }
→ 401 { valid: false, reason: "missing_token" }
```

Validación:

1. Extrae `token_id` del JWT
2. Busca en `magic_links` por `id = token_id`
3. Si no existe → `reason: "revoked"` (el link fue borrado)
4. Si `status === "revoked"` → `reason: "revoked"`
5. Si `expirationDate < now` → `reason: "expired"`
6. Calcula `effectiveExpiresAt = min(JWT exp, DB expirationDate)`

#### `apps/api/src/services/email.ts` — Logs de debug

Agregados logs en cada paso del envío para diagnosticar que `RESEND_API_KEY` estaba en `apps/api/.env` en vez de en el root `.env`.

### 3.6. Frontend — Auth y Cookies

#### `apps/admin-panel-web/src/app/auth/magic-link/route.ts`

- Recibe `expiresAt` del backend (si está presente) o lo deriva del JWT como fallback.
- Setea `magic-link-exp` cookie: `non-httpOnly`, `SameSite=Strict`, `path=/`, valor ISO8601.

#### `apps/admin-panel-web/src/app/actions/logout.ts`

- Borra ambas cookies: `auth-token` y `magic-link-exp`.

#### `apps/admin-panel-web/src/lib/auth.ts` — Unión discriminada

```typescript
export type AuthUser = {
  kind: "auth"
  id_admin_users: number
  name_admin_users: string
  email_admin_users: string
}

export type MagicLinkUser = {
  kind: "magic-link"
  token_id: string
  role: string
  scopeId: string
  destinationScreen?: string
}

export type User = AuthUser | MagicLinkUser
```

`getAuthUser()`:

- Intenta `jwt.verify` como `AuthUser`.
- Si falla, intenta como `MagicLinkUser`.
- Retorna `null` si ambos fallan.

#### `apps/admin-panel-web/src/middleware.ts`

- Al redirigir un usuario no autenticado, también borra `magic-link-exp` para evitar que el countdown quede visible en la página de login.

### 3.7. Frontend — Estado Cliente

#### `apps/admin-panel-web/src/components/session-monitor-provider.tsx`

1. **Inicialización:** lee `magic-link-exp` de `document.cookie` al montar.
2. **Countdown:** `setInterval` cada 1s, formatea `H:MM:SS`.
3. **Polling:** `setInterval` cada 30s, llama `GET /api/auth/magic-link/session`.
4. **Invalidación:** si `valid === false`, muestra toast contextual y llama `logoutAction` después de 3.5s.
5. **Cross-tab sync:**
   - **BroadcastChannel** (primary): `bc.postMessage({type: "magic-link-invalidated", reason})`
   - **Storage fallback:** `localStorage.setItem("magic-link-invalidated", ...)` + listener `window.addEventListener("storage", ...)`
   - Limpia `localStorage` después de 100ms para evitar polución.

**Toast messages:**
| Reason | Título | Descripción |
|---|---|---|
| `revoked` | **link revocado** | Tu acceso fue revocado. Serás redirigido en unos segundos. |
| `expired` (default) | **tiempo superado** | Tu sesión expiró. Serás redirigido en unos segundos. |

#### `apps/admin-panel-web/src/hooks/useSessionMonitor.ts`

Thin hook que consume `SessionMonitorContext`. Usado por `SessionCountdown`.

### 3.8. Frontend — UI

#### `apps/admin-panel-web/src/components/session-countdown.tsx`

- **Badge** de shadcn/ui con **cva** para variantes.
- **Formato**: `H:MM:SS` (con horas si `remaining >= 3600s`).
- **Icono**: `ClockIcon` de lucide-react.
- **Tamaño**: `h-8`, `text-sm`, `px-3`.
- **Variantes**:
  - `default` (>5min): `bg-primary text-primary-foreground`
  - `warning` (1-5min): `bg-muted-foreground text-background ring-1`
  - `danger` (<1min): `bg-destructive text-white animate-pulse`
- **Posición**: Header superior derecho (`ml-auto` en `dashboard/layout.tsx`).

#### `apps/admin-panel-web/src/components/app-sidebar.tsx` (modificado)

- Removida la prop `sessionSlot` (antes renderizaba el countdown en el footer).
- Ahora acepta solo `user` y mapea `MagicLinkUser` a `NavUser` props:
  - `name`: `formatRole(role)`
  - `email`: `scopeId`

#### `apps/admin-panel-web/src/app/dashboard/layout.tsx` (modificado)

- Wrap con `<SessionMonitorProvider>`.
- Renderiza `<SessionCountdown />` en el header, alineado a la derecha (`ml-auto`).

### 3.9. Frontend — Proxy API

#### `apps/admin-panel-web/src/app/api/auth/magic-link/session/route.ts`

Next.js Route Handler:

1. Lee `auth-token` cookie (httpOnly) server-side.
2. Forwards como `Authorization: Bearer <token>` a `GET ${apiUrl}/auth/magic-link/session`.
3. Si la API devuelve `valid: true` pero sin `expiresAt`, enriquece con `getJwtExpiresAt()` del token.
4. Retorna JSON al cliente.

Por qué un Route Handler: el cliente JS no puede leer cookies httpOnly. Este endpoint actúa como proxy seguro.

---

## 4. Bugs Encontrados y Corregidos

### 4.1. CRÍTICO: "tiempo superado" inmediato al entrar con Magic Link

**Síntoma:** Creás un link de 1h, entrás con él, y a los pocos segundos aparece **"tiempo superado"** y te saca.

**Causa raíz:**

1. Usuario hace click → `POST /verify` marca el link como `status = "used"` (si es single-use).
2. Se setea la cookie `auth-token` con JWT válido por 8h.
3. El `SessionMonitorProvider` hace su primera poll a `GET /session`.
4. El endpoint ve `status === "used"` y devuelve `valid: false, reason: "used"`.
5. El provider no tiene handler para `"used"`, así que cae al default `"expired"` → toast "tiempo superado" → logout.

**Fix:**

1. `GET /session` ya NO considera `status === "used"` como inválido. Solo `"revoked"` y tiempo vencido invalidan.
2. `POST /verify` ahora devuelve `expiresAt` (la fecha REAL del link, no la del JWT de 8h).

### 4.2. CRÍTICO: `ReferenceError` en catch block del verify

**Síntoma:** Si el backend fallaba (red caída, API down), el catch block explotaba con `ReferenceError: origin is not defined`.

**Causa:** La variable `origin` no existía en el scope. La correcta era `baseUrl`.

**Fix:** `return redirectWithError("unknown", baseUrl)` en vez de `origin`.

### 4.3. Email de Magic Link no funcionaba

**Síntoma:** Enviabas un link por email, la UI decía "Link enviado", pero nunca llegaba.

**Causa raíz (triple problema):**

1. `apps/api/src/env.ts` carga dotenv desde `../../.env` (root del monorepo), no desde `apps/api/.env`.
2. El `RESEND_API_KEY` estaba en `apps/api/.env` pero el backend nunca lo leyó.
3. El root `.env` tenía una API key vieja de Resend que no funcionaba.

**Fix:**

1. Actualizar `RESEND_API_KEY` en el root `.env` con la key correcta.
2. Agregar logs de debug en `email.ts` y `control_magic_links.ts`.
3. El servicio ahora chequea `result.error` del objeto de retorno de Resend.

### 4.4. Countdown mostraba 8h en vez de la duración real del link

**Síntoma:** Creabas un link de 1h pero el countdown mostraba 7:59:59.

**Causa:** La cookie `magic-link-exp` se seteaba con `getJwtExpiresAt(data.token)`, que derivaba la expiración del JWT (8h hardcoded).

**Fix:** El backend `POST /verify` ahora calcula `effectiveExpiresAt = min(JWT 8h, DB expirationDate)` y lo devuelve. El frontend usa `data.expiresAt` con fallback al JWT.

### 4.5. Temporizador muy chico y mal ubicado

**Síntoma:** El countdown era un Badge minúsculo (`h-5`, `text-xs`) escondido en el footer del sidebar.

**Fix:**

- Reposicionado al header superior derecho (`ml-auto`).
- Agrandado a `h-8`, `text-sm`, con `ClockIcon`.
- Agregado `animate-pulse` en variante `danger`.

### 4.6. IDs tipados como string en el frontend

**Síntoma:** El backend devuelve `id_leads: number`, pero el contrato no especificaba el tipo explícitamente. El frontend asumió `string`, rompiendo `POST /notes`.

**Fix:** Cambiar todos los IDs de `string` → `number` en `src/lib/types.ts`.

### 4.7. Azure Storage sin manejo de errores de conexión

**Síntoma:** `azure_services.ts` inicializaba el `BlobServiceClient` de forma eager, causando crash del backend si `AZURE_STORAGE_CONNECTION_STRING` estaba ausente.

**Fix:** Conversión a inicialización lazy (solo se conecta cuando se usa).

---

## 5. Métricas y Resultados

### 5.1. Contribución Mateo

| Métrica                    | Valor           |
| -------------------------- | --------------- |
| Ramas creadas              | 8               |
| Commits productivos        | 12              |
| Controladores creados      | 7               |
| DTOs creados               | 7               |
| Schemas de DB              | 6               |
| Servicios creados          | 4               |
| Middleware creados         | 2               |
| Migraciones Drizzle        | 5 (0000 → 0004) |
| Documentos técnicos        | 3               |
| Archivos totales afectados | ~80+            |

### 5.2. Contribución Steven

| Área                                         | Archivos | Líneas (approx) |
| -------------------------------------------- | -------- | --------------- |
| Backend (API + JWT + Email logs)             | 3        | ~90             |
| Frontend — Auth, Cookies, Middleware         | 4        | ~60             |
| Frontend — Estado cliente (Provider + Hook)  | 2        | ~170            |
| Frontend — UI (Countdown + Layout + Sidebar) | 3        | ~80             |
| Frontend — Proxy Route Handler               | 1        | ~60             |
| **Total**                                    | **13**   | **~460**        |

### 5.3. Escenarios Validados (Magic Link)

| #   | Escenario                                                               | Resultado |
| --- | ----------------------------------------------------------------------- | --------- |
| 1   | Usuario entra con link de 1h, ve countdown en header                    | ✅        |
| 2   | Esperar a que pase el tiempo → toast "tiempo superado" → redirect       | ✅        |
| 3   | Admin revoca link → sesión cierra en ≤30s → toast "link revocado"       | ✅        |
| 4   | Dos pestañas abiertas, admin revoca → ambas se cierran instantáneamente | ✅        |
| 5   | Refresh de página → countdown resume desde tiempo restante correcto     | ✅        |
| 6   | Usuario admin (no magic-link) → no ve countdown, no hay polling         | ✅        |
| 7   | Enviar magic link por email → llega al inbox                            | ✅        |
| 8   | Link de un solo uso → se marca "used" pero sesión sigue activa          | ✅        |

---

## 6. Próximos Pasos Recomendados

1. **Tests manuales en staging** — Validar el flujo end-to-end con un link real de 1h y revocación.
2. **Configurar dominio en Resend** — Para poder enviar emails a direcciones que no sean la propia (modo testing de Resend limita esto).
3. **Configurable poll interval** — Actualmente fijo en 30s. Podría ser configurable por ambiente (10s en dev, 60s en prod).
4. **Audit log de revocaciones** — Loguear quién revocó el link, desde qué IP, y en qué momento.
5. **Notificaciones por email al revocar** — Opcional: avisar al usuario por email que su acceso fue revocado.
6. **Paginación en `getAllLeadsWithQuotes`** — El endpoint devuelve todos los registros. Para volúmenes >500, será un problema de performance.
7. **Migrar DTOs manuales a Zod** — Mateo implementó sanitizadores manuales. Migrar a Zod schemas con inferencia de tipos reduce inconsistencias.

---

## 7. Dependencias Introducidas

| Paquete               | Versión | Propósito                   |
| --------------------- | ------- | --------------------------- |
| `hono`                | ^4.x    | Framework web API           |
| `@hono/node-server`   | —       | Adapter Node.js para Hono   |
| `drizzle-orm`         | ^0.39   | ORM PostgreSQL              |
| `drizzle-kit`         | —       | CLI para migraciones        |
| `pg`                  | —       | Driver PostgreSQL para Node |
| `@azure/storage-blob` | ^12.x   | Azure Blob Storage client   |
| `jsonwebtoken`        | —       | JWT signing/verification    |
| `dotenv`              | —       | Variables de entorno        |

---

## 8. Archivos Relacionados

### Backend Mateo

- `apps/api/src/controller/` — 7 controladores CRUD + auth
- `apps/api/src/services/` — Lógica de negocio
- `apps/api/src/dto/` — Validación y sanitización
- `apps/api/src/database/schemas/` — Drizzle schemas
- `apps/api/drizzle/` — Migraciones
- `apps/api/src/middleware/` — Auth y API key
- `apps/api/src/utils/` — CRUD genérico, JWT, crypting, audit
- `docs/contrato-leads-quotes.md`
- `docs/servicioAzureStorage.md`

### Frontend / Integración Steven

- `apps/admin-panel-web/src/app/dashboard/layout.tsx`
- `apps/admin-panel-web/src/lib/auth.ts`
- `apps/admin-panel-web/src/app/auth/magic-link/route.ts`
- `apps/admin-panel-web/src/app/api/auth/magic-link/session/route.ts`
- `apps/admin-panel-web/src/components/session-monitor-provider.tsx`
- `apps/admin-panel-web/src/components/session-countdown.tsx`
- `apps/admin-panel-web/src/hooks/useSessionMonitor.ts`
- `apps/admin-panel-web/src/app/actions/logout.ts`
- `apps/admin-panel-web/src/middleware.ts`
- `apps/admin-panel-web/src/components/app-sidebar.tsx`
- `apps/admin-panel-web/src/lib/leads.ts`
- `apps/admin-panel-web/src/lib/types.ts`
- `apps/admin-panel-web/src/lib/api-client.ts`
- `apps/api/src/controller/control_magic_link_auth.ts`
- `apps/api/src/controller/control_magic_links.ts`
- `apps/api/src/utils/jwt.ts`
- `apps/api/src/services/email.ts`
- `apps/api/src/env.ts`
- `.env`

### Integración Web-API

- `apps/nexus-corp-web/src/components/QuoteWizard.tsx`
- `apps/nexus-corp-web/src/pages/api/quotes-with-lead.ts`
- `apps/nexus-corp-web/src/pages/api/contact.ts`
- `apps/nexus-corp-web/src/pages/api/webinar-registration.ts`

### Seed / Scripts

- `apps/api/src/scripts/seed-admin-direct.ts`
- `apps/api/src/scripts/seed-leads-and-quotes.ts`
- `apps/api/src/scripts/clean-magic-links.ts`
- `scripts/predev.sh`

---
