# Informe de Desarrollo: Magic Link Session Lifecycle — Temporizador, Revocación Instantánea y Notificaciones Contextuales

**Fecha:** 2026-07-06  
**Autor:** Steven y Mateo
**Rama:** Dev/Steven - Dev/Mateo
**Estado:** Subido

---

## 1. Resumen Ejecutivo

- Implementación completa del ciclo de vida de sesiones **Magic Link** en el panel de administración y la API. Esto arregla dos problemas críticos de seguridad y UX: (1) las sesiones Magic Link expiraban invisibles para el usuario, sin ningún temporizador ni aviso, y (2) cuando el administrador revocaba un Magic Link, la sesión del usuario seguía activa indefinidamente.

- Mateo Velasco construyó el **100% del backend API** y la **infraestructura base** del proyecto NEXUS Corp. Su trabajo abarca desde la configuración Docker inicial hasta el servicio de Azure Blob Storage, pasando por la base de datos PostgreSQL con Drizzle ORM, todos los controladores CRUD, el sistema de autenticación, y la integración de la API con el frontend público.

### Qué se entregó Steven

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

---

## 2. Contexto y Motivación

### 2.1. Problema

El sistema de Magic Links ya permitía generar, enviar y verificar enlaces de acceso, pero el ciclo de vida de la sesión era **completamente invisible**:

1. **Sin temporizador:** El usuario no veía cuánto tiempo le quedaba. El link podía vencerse en 1h y el usuario seguía dentro del dashboard sin saberlo.
2. **Revocación sin efecto:** Cuando el administrador revocaba un link desde el panel, la base de datos cambiaba a `status = "revoked"`, pero el JWT en la cookie `auth-token` seguía siendo aceptado por el middleware. El usuario nunca se enteraba.
3. **Mensajes solo en login:** Los errores `expired`, `revoked`, `used` solo aparecían como banner en la página de login (`/?magic_error=...`). Si el usuario ya estaba dentro del dashboard, no había forma de notificarle.
4. **Sidebar mostraba "Invitado":** Los usuarios de Magic Link tenían un JWT con `{token_id, role, scopeId}`, pero `getAuthUser()` esperaba `{id_admin_users, name_admin_users, email_admin_users}`, así que devolvía `null` y el sidebar mostraba "Invitado".
5. **Bug crítico:** Al usar un link de un solo uso (`single`), el `POST /verify` lo marcaba como `status = "used"` inmediatamente. El siguiente poll de `GET /session` lo invalidaba, mostrando **"tiempo superado"** a los pocos segundos de entrar.

### 2.2. Objetivo

1. Dar **visibilidad** del tiempo restante a los usuarios de Magic Link.
2. Invalidar sesiones **automáticamente** cuando el admin revoca o el tiempo vence.
3. Mostrar **mensajes contextuales** en runtime (dentro del dashboard), no solo en login.
4. Asegurar que un link "usado" no cierre una sesión activa (solo previene nuevos logins).
5. Corregir la configuración de email (Resend) para que el envío funcione.

---

## 3. Arquitectura de la Solución

### 3.1. Diagrama de Flujo de Datos

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

### 3.2. Decisiones de Diseño Clave

| Decisión                                           | Alternativa Rechazada               | Fundamento                                                                                                                                                                                                    |
| -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Polling HTTP cada 30s**                          | WebSocket / SSE                     | No hay infra de real-time en el proyecto. WebSocket requiere conexiones persistentes y manejo de estado en el backend. Polling es stateless, simple y suficiente para una latencia de 30s en un admin panel.  |
| **Cookie `magic-link-exp` (non-httpOnly)**         | Parsear JWT en cliente              | El JWT está en cookie httpOnly, inaccesible desde JS. Una cookie separada con solo la fecha de expiración evita exponer secretos y permite el countdown sin server round-trip.                                |
| **BroadcastChannel + storage fallback**            | Solo polling                        | Sin BroadcastChannel, una pestaña abierta esperaría hasta 30s para enterarse de una revocación. BC permite logout instantáneo. Storage event es fallback para Safari.                                         |
| **Unión discriminada `AuthUser \| MagicLinkUser`** | Sintetizar magic-link como AuthUser | `AuthUser` tiene campos que no existen en magic-link (`id_admin_users`, `email_admin_users`). Una unión con `kind` discriminant previene bugs donde el código asume que todo usuario tiene email_admin_users. |
| **GET /session no invalida por "used"**            | Mantener `used` como inválido       | Un link "used" significa "ya fue usado para loguearse", no "la sesión es inválida". El JWT sigue siendo válido hasta su expiración. Invalidar por "used" causaba el bug de "tiempo superado" inmediato.       |

---

## 4. Desglose Técnico

### 4.1. Backend (3 archivos modificados)

#### `apps/api/src/utils/jwt.ts` — `verifyMagicLinkToken()`

Nuevo helper para verificar JWTs de Magic Link con `jwt.verify`, retornando `MagicLinkJwtPayload` (`token_id`, `role`, `scopeId`, `destinationScreen`).

#### `apps/api/src/controller/control_magic_link_auth.ts` — `POST /verify` y `GET /session`

**POST /verify** (antes):

- Devolvía solo `{token, role, scopeId, destinationScreen}`
- Marcaba link como `status = "used"` inmediatamente (para `single` usage)

**POST /verify** (después):

- Devuelve `expiresAt`: `min(JWT exp 8h, DB expirationDate)`
- Sigue marcando como "used" para prevenir re-uso, pero el `GET /session` ya no considera "used" como inválido

**GET /session** (nuevo):

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

Agregados logs en cada paso del envío:

- `[Email Service] RESEND_API_KEY present? true/false`
- `[Email Service] Sending email via Resend... {from, to}`
- `[Email Service] Resend response: {...}`
- `[Email Service] Exception sending email: ...`

Esto permitió diagnosticar que el problema era que `RESEND_API_KEY` estaba en `apps/api/.env` en vez de en el root `.env` (que es donde `env.ts` carga dotenv).

#### `apps/api/src/controller/control_magic_links.ts` — Logs de debug

Agregados logs alrededor del envío de email en `POST /`:

- `[MagicLink Create] Attempting to send email to: ...`
- `[MagicLink Create] Email send result: {sent, error?}`

### 4.2. Frontend — Auth y Cookies (4 archivos modificados)

#### `apps/admin-panel-web/src/app/auth/magic-link/route.ts`

- Recibe `expiresAt` del backend (si está presente) o lo deriva del JWT como fallback
- Setea `magic-link-exp` cookie: `non-httpOnly`, `SameSite=Strict`, `path=/`, valor ISO8601

#### `apps/admin-panel-web/src/app/actions/logout.ts`

- Borra ambas cookies: `auth-token` y `magic-link-exp`

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

- Intenta `jwt.verify` como `AuthUser` (campos `id_admin_users`)
- Si falla, intenta como `MagicLinkUser` (campos `token_id`, `role`)
- Retorna `null` si ambos fallan

#### `apps/admin-panel-web/src/middleware.ts`

- Al redirigir un usuario no autenticado, también borra `magic-link-exp` para evitar que el countdown quede visible en la página de login

### 4.3. Frontend — Estado Cliente (2 archivos nuevos)

#### `apps/admin-panel-web/src/components/session-monitor-provider.tsx`

**Responsabilidades:**

1. **Inicialización**: lee `magic-link-exp` de `document.cookie` al montar
2. **Countdown**: `setInterval` cada 1s, formatea `H:MM:SS`
3. **Polling**: `setInterval` cada 30s, llama `GET /api/auth/magic-link/session`
4. **Invalidación**: si `valid === false`, muestra toast contextual y llama `logoutAction` después de 3.5s
5. **Cross-tab sync**:
   - **BroadcastChannel** (primary): `bc.postMessage({type: "magic-link-invalidated", reason})`
   - **Storage fallback**: `localStorage.setItem("magic-link-invalidated", JSON.stringify({reason, time}))` + listener `window.addEventListener("storage", ...)`
   - Limpia `localStorage` después de 100ms para evitar polución

**Toast messages:**
| Reason | Título | Descripción |
|---|---|---|
| `revoked` | **link revocado** | Tu acceso fue revocado. Serás redirigido en unos segundos. |
| `expired` (default) | **tiempo superado** | Tu sesión expiró. Serás redirigido en unos segundos. |

#### `apps/admin-panel-web/src/hooks/useSessionMonitor.ts`

Thin hook que consume `SessionMonitorContext`. Usado por `SessionCountdown`.

### 4.4. Frontend — UI (1 archivo nuevo, 2 modificados)

#### `apps/admin-panel-web/src/components/session-countdown.tsx`

- **Badge** de shadcn/ui con **cva** para variantes
- **Formato**: `H:MM:SS` (con horas si `remaining >= 3600s`)
- **Icono**: `ClockIcon` de lucide-react
- **Tamaño**: `h-8`, `text-sm`, `px-3` (antes era `h-5`, `text-xs`)
- **Variantes**:
  - `default` (>5min): `bg-primary text-primary-foreground`
  - `warning` (1-5min): `bg-muted-foreground text-background ring-1`
  - `danger` (<1min): `bg-destructive text-white animate-pulse`
- **Posición**: Header superior derecho (`ml-auto` en `dashboard/layout.tsx`)

#### `apps/admin-panel-web/src/components/app-sidebar.tsx` (modificado)

- Removida la prop `sessionSlot` (antes renderizaba el countdown en el footer)
- Ahora acepta solo `user` y mapea `MagicLinkUser` a `NavUser` props:
  - `name`: `formatRole(role)` (ej: "Administrador", "Vendedor")
  - `email`: `scopeId` (ej: "all", "zone-norte")

#### `apps/admin-panel-web/src/app/dashboard/layout.tsx` (modificado)

- Wrap con `<SessionMonitorProvider>`
- Renderiza `<SessionCountdown />` en el header, alineado a la derecha (`ml-auto`)
- El sidebar ya no recibe `sessionSlot`

### 4.5. Frontend — Proxy API (1 archivo nuevo)

#### `apps/admin-panel-web/src/app/api/auth/magic-link/session/route.ts`

Next.js Route Handler:

1. Lee `auth-token` cookie (httpOnly) server-side
2. Forwards como `Authorization: Bearer <token>` a `GET ${apiUrl}/auth/magic-link/session`
3. Si la API devuelve `valid: true` pero sin `expiresAt`, enriquece con `getJwtExpiresAt()` del token
4. Retorna JSON al cliente

Por qué un Route Handler: el cliente JS no puede leer cookies httpOnly. Este endpoint actúa como proxy seguro.

---

## 5. Bugs Encontrados y Corregidos

### 5.1. CRÍTICO: "tiempo superado" inmediato al entrar con Magic Link

**Síntoma:** Creás un link de 1h, entrás con él, y a los pocos segundos aparece **"tiempo superado"** y te saca.

**Causa raíz:** El flujo era:

1. Usuario hace click → `POST /verify` marca el link como `status = "used"` (si es single-use)
2. Se setea la cookie `auth-token` con JWT válido por 8h
3. El `SessionMonitorProvider` hace su primera poll a `GET /session`
4. El endpoint ve `status === "used"` y devuelve `valid: false, reason: "used"`
5. El provider no tiene handler para `"used"`, así que cae al default `"expired"` → toast "tiempo superado" → logout

**Fix:**

1. `GET /session` ya NO considera `status === "used"` como inválido. Solo `"revoked"` y tiempo vencido invalidan.
2. `POST /verify` ahora devuelve `expiresAt` (la fecha REAL del link, no la del JWT de 8h), así que el countdown muestra el tiempo correcto.

### 5.2. CRÍTICO: `ReferenceError` en catch block del verify

**Síntoma:** Si el backend fallaba (red caída, API down), el catch block explotaba con `ReferenceError: origin is not defined` en vez de redirigir al login con error.

**Causa:** La variable `origin` no existía en el scope. La correcta era `baseUrl`.

**Fix:** `return redirectWithError("unknown", baseUrl)` en vez de `origin`.

### 5.3. Email de Magic Link no funcionaba

**Síntoma:** Enviabas un link por email, la UI decía "Link enviado", pero nunca llegaba.

**Causa raíz (triple problema):**

1. `apps/api/src/env.ts` carga dotenv desde `../../.env` (root del monorepo), no desde `apps/api/.env`
2. El `RESEND_API_KEY` estaba en `apps/api/.env` (creado por nosotros) pero el backend nunca lo leyó
3. El root `.env` tenía una API key vieja de Resend (`re_6Kgm5Dav_...`) que no funcionaba

**Fix:**

1. Actualizar `RESEND_API_KEY` en el root `.env` con la key correcta proporcionada por el usuario
2. Agregar logs de debug en `email.ts` y `control_magic_links.ts` para diagnóstico futuro
3. El servicio ahora chequea `result.error` del objeto de retorno de Resend, no solo try/catch

### 5.4. Countdown mostraba 8h en vez de la duración real del link

**Síntoma:** Creabas un link de 1h pero el countdown mostraba 7:59:59.

**Causa:** La cookie `magic-link-exp` se seteaba con `getJwtExpiresAt(data.token)`, que derivaba la expiración del JWT (8h hardcoded), no de la base de datos.

**Fix:** El backend `POST /verify` ahora calcula `effectiveExpiresAt = min(JWT 8h, DB expirationDate)` y lo devuelve en la respuesta. El frontend usa `data.expiresAt` con fallback al JWT.

### 5.5. Temporizador muy chico y mal ubicado

**Síntoma:** El countdown era un Badge minúsculo (`h-5`, `text-xs`) escondido en el footer del sidebar, casi invisible.

**Fix:**

- Reposicionado al header superior derecho (`ml-auto`)
- Agrandado a `h-8`, `text-sm`, con `ClockIcon`
- Agregado `animate-pulse` en variante `danger` para mayor visibilidad

---

## 6. Métricas y Resultados

### 6.1. Líneas de Código

| Área                                         | Archivos | Líneas (approx) |
| -------------------------------------------- | -------- | --------------- |
| Backend (API + JWT + Email logs)             | 3        | ~90             |
| Frontend — Auth, Cookies, Middleware         | 4        | ~60             |
| Frontend — Estado cliente (Provider + Hook)  | 2        | ~170            |
| Frontend — UI (Countdown + Layout + Sidebar) | 3        | ~80             |
| Frontend — Proxy Route Handler               | 1        | ~60             |
| **Total**                                    | **13**   | **~460**        |

### 6.2. Escenarios Validados

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

## 7. Próximos Pasos Recomendados

1. **Merge a `master`** — Todo el trabajo está en `Dev/Steven`, listo para merge.
2. **Tests manuales en staging** — Validar el flujo end-to-end con un link real de 1h y revocación.
3. **Configurar dominio en Resend** — Para poder enviar emails a direcciones que no sean la propia (modo testing de Resend limita esto).
4. **Configurable poll interval** — Actualmente fijo en 30s. Podría ser configurable por ambiente (10s en dev, 60s en prod).
5. **Audit log de revocaciones** — Loguear quién revocó el link, desde qué IP, y en qué momento.
6. **Notificaciones por email al revocar** — Opcional: avisar al usuario por email que su acceso fue revocado.

---

## 8. Archivos Relacionados

- **Frontend admin:** `apps/admin-panel-web/src/app/dashboard/layout.tsx`
- **Auth:** `apps/admin-panel-web/src/lib/auth.ts`
- **Cookie verify:** `apps/admin-panel-web/src/app/auth/magic-link/route.ts`
- **Proxy session:** `apps/admin-panel-web/src/app/api/auth/magic-link/session/route.ts`
- **Monitor provider:** `apps/admin-panel-web/src/components/session-monitor-provider.tsx`
- **Countdown:** `apps/admin-panel-web/src/components/session-countdown.tsx`
- **Hook:** `apps/admin-panel-web/src/hooks/useSessionMonitor.ts`
- **Logout action:** `apps/admin-panel-web/src/app/actions/logout.ts`
- **Middleware:** `apps/admin-panel-web/src/middleware.ts`
- **Sidebar:** `apps/admin-panel-web/src/components/app-sidebar.tsx`
- **Backend controller:** `apps/api/src/controller/control_magic_link_auth.ts`
- **Backend JWT:** `apps/api/src/utils/jwt.ts`
- **Backend email:** `apps/api/src/services/email.ts`
- **Backend env:** `apps/api/src/env.ts`
- **Root .env:** `.env`
- **DB cleanup script:** `apps/api/src/scripts/clean-magic-links.ts`

---

_Informe generado tras la sesión de desarrollo del 2026-07-06. Magic Link Session Lifecycle implementado con SDD (Spec-Driven Development)._
