# Informe de Desarrollo: Contribuciones de Mateo Velasco

**Fecha:** 2026-07-06  
**Autor:** Documentación técnica (basado en análisis de rama)  
**Ramas analizadas:** 8 ramas `mateo/dev/*` + `Dev/Mateo`  
**Total commits de Mateo:** 12 commits productivos  
**Estado:** Todo mergeado a `master`  

---

## 1. Resumen Ejecutivo

Mateo Velasco construyó el **100% del backend API** y la **infraestructura base** del proyecto NEXUS Corp. Su trabajo abarca desde la configuración Docker inicial hasta el servicio de Azure Blob Storage, pasando por la base de datos PostgreSQL con Drizzle ORM, todos los controladores CRUD, el sistema de autenticación, y la integración de la API con el frontend público.

**Rama de trabajo principal:** `mateo/dev/*` (8 ramas secuenciales)  
**Total archivos creados/modificados:** ~80+ archivos  
**Áreas cubiertas:** Infraestructura, Base de Datos, Backend API, Integración Web, Almacenamiento Cloud

---

## 2. Contexto y Timeline

Mateo trabajó en ramas secuenciales que fueron mergeadas progresivamente a `master`. Cada rama representa una fase de maduración del backend:

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

**Merge a master:**
- PR #4 (`56bec50`) — Docker + Hono
- PR #5 (`3120f3a`) — CRUD completo
- PR #8 (`acfd110`) — Pruebas + acceptTerms
- Merge directo (`94abf37`) — Azure Storage

---

## 3. Desglose por Rama

### 3.1. `mateo/dev/docker-integracion` (5 commits)

**Objetivo:** Establecer la infraestructura de desarrollo con Docker y reemplazar Express por Hono.js.

| Commit | Descripción |
|---|---|
| `0335bf7` | Configurar Docker, API Hono y entorno de desarrollo |
| `fedebf4` | Renombrar informe.md → Informe-actividades-1-7-2026.md |
| `9fe3271` | Integrar cambios de master con configuración Docker |
| `a3251ea` | Normalizar nombres de carpetas apps en minúsculas |
| `4c691a9` | Optimización de Dockerfiles y manejo de dependencias |

**Archivos creados:**
- `docker-compose.yml` — 5 servicios: postgres, pgAdmin, api, admin, web
- `Dockerfile.api.dev`, `Dockerfile.admin.dev`, `Dockerfile.web.dev`
- `apps/api/src/index.ts` — Entry point de Hono
- `apps/api/src/modules/*.ts` — Stubs iniciales para admin_users, audit_logs, leads, quotes, lead_notes
- `Informe-actividades-1-7-2026.md` — Documentación del setup Docker

**Decisiones técnicas:**
- **Hono.js sobre Express:** ~14KB vs ~200KB, tipado fuerte nativo, compatible con Node/Bun/Edge
- **PostgreSQL 17** con pgAdmin para gestión visual
- **Normalización de nombres de carpetas:** Windows es case-insensitive, Linux Docker no. Mateo renombró `Admin-panel-web` → `admin-panel-web` y `Nexus-Corp-Web` → `nexus-corp-web`
- **Binding explícito `0.0.0.0`:** Para que los servicios sean accesibles desde fuera del contenedor en cualquier SO

---

### 3.2. `mateo/dev/services-database` (1 commit)

**Objetivo:** Inicializar la base de datos con Drizzle ORM y definir los 5 schemas core.

| Commit | Descripción |
|---|---|
| `b77ecd7` | Inicialización de la base de datos — ORM Drizzle |

**Archivos creados:**
- `apps/api/drizzle.config.ts` — Configuración de Drizzle ORM
- `apps/api/drizzle/0000_wooden_sally_floyd.sql` — Migración inicial
- `apps/api/src/database/database.ts` — Conexión a PostgreSQL
- `apps/api/src/database/schemas/`:
  - `admin_users.ts` — Usuarios administradores
  - `audit_logs.ts` — Registro de auditoría
  - `leads.ts` — Leads del sistema
  - `quotes.ts` — Cotizaciones
  - `lead_notes.ts` — Notas de seguimiento
  - `index.ts` — Export centralizado

**Schemas definidos:**

| Tabla | Columnas clave |
|---|---|
| `leads` | id_leads (serial PK), name_leads, email_leads, phone_leads (unique), city_leads, status_leads (enum), source_leads (enum), monthly_family_income (decimal), coments_optionals_lead, accepted_terms_lead, accepted_terms_at, accepted_terms_ip |
| `quotes` | id_quotes (serial PK), lead_id (FK), product_quotes (enum), requested_amount_quotes, down_payment_quotes, term_months_quotes, annual_interest_rate_quotes, monthly_payment_quotes, contact_preference_quotes (enum), result_status_quotes |
| `lead_notes` | id_lead_notes (serial PK), manager_lead_notes, note_lead_notes, id_leads (FK) |
| `admin_users` | id_admin_users (serial PK), name_admin_users, email_admin_users, password_admin_users, active |
| `audit_logs` | id_audit_logs (serial PK), action, entity, entity_id, user_id, details, ip_address, created_at |

---

### 3.3. `mateo/dev/services-api` (2 commits)

**Objetivo:** Construir todos los controladores CRUD, DTOs, middleware de seguridad y servicios de negocio.

| Commit | Descripción |
|---|---|
| `c66d983` | Finalización del CRUD de la DB, endpoints de logging, integración de CRUD de leads a web en formulario webinar |
| `c41e102` | (Merge/integration commit) |

**Archivos creados:**

**Controladores (7 controladores):**
- `apps/api/src/controller/control_adm.ts` — CRUD admin_users
- `apps/api/src/controller/control_auth.ts` — Autenticación JWT (221 líneas)
- `apps/api/src/controller/control_lead.ts` — CRUD leads + status updates
- `apps/api/src/controller/control_lead_notes.ts` — CRUD notas de seguimiento
- `apps/api/src/controller/control_quote.ts` — CRUD cotizaciones + `POST /quotes/with-lead`
- `apps/api/src/controller/control_audit_logs.ts` — Registro de auditoría
- `apps/api/src/routes/routes_controller.ts` — Router central Hono

**DTOs (7 archivos de validación):**
- `apps/api/src/dto/admin_users_dto.ts`
- `apps/api/src/dto/authDTO.ts`
- `apps/api/src/dto/leadDTO.ts` — LeadCreateDto, LeadUpdateStatusDto, LeadResponseDto
- `apps/api/src/dto/lead_notesDTO.ts` — LeadNoteCreateDto, LeadNoteUpdateDto
- `apps/api/src/dto/quotesDTO.ts` — QuoteCreateDto, QuoteUpdateDto
- `apps/api/src/dto/quotes_whit_leadDTO.ts` — QuoteWithLeadFlexDto, sanitizeCreateQuoteWithLeadRequest
- `apps/api/src/dto/audit_logsDTO.ts`

**Middleware:**
- `apps/api/src/middleware/auth.ts` — Validación JWT
- `apps/api/src/middleware/api_key_middleware.ts` — Protección con header `x-api-key`

**Utilidades:**
- `apps/api/src/utils/crud.ts` — Funciones genéricas CRUD (getAll, getById, createOne, updateById, deleteById, listWithFilters, getByField)
- `apps/api/src/utils/crypting.ts` — Encriptación AES-256-GCM para passwords
- `apps/api/src/utils/jwt.ts` — Generación y validación de JWT
- `apps/api/src/utils/audit.ts` — Helper para logging de auditoría
- `apps/api/src/utils/request.ts` — Utilidades para requests HTTP

**Servicios:**
- `apps/api/src/services/quotes_services.ts` — Lógica de negocio para crear cotización con lead (`createQuoteWithLead`)

**Integración Web:**
- `apps/nexus-corp-web/src/pages/api/webinar-registration.ts` — Reescrito para llamar a la API en vez de DB directa

**Migraciones:**
- `apps/api/drizzle/0001_clean_grandmaster.sql`

---

### 3.4. `mateo/dev/integration-web-api` (1 commit)

**Objetivo:** Integrar completamente la API con el frontend público (nexus-web).

| Commit | Descripción |
|---|---|
| `cd8bebe` | Se integra la API a la web y se modifican las pantallas visuales para mayor legibilidad |

**Archivos modificados/creados:**
- `apps/nexus-corp-web/src/components/QuoteWizard.tsx` — **Reescritura mayor** (436 líneas cambiadas). Ahora comunica con el backend vía API en vez de cálculo/client-side puro.
- `apps/nexus-corp-web/src/pages/api/quotes-with-lead.ts` — **NUEVO** endpoint proxy que reenvía al backend
- `apps/nexus-corp-web/src/pages/api/quotes.ts` — Facade para el frontend
- `apps/nexus-corp-web/src/pages/api/contact.ts` — Actualizado para usar la API
- `apps/nexus-corp-web/src/pages/api/webinar-registration.ts` — Actualizado
- `apps/nexus-corp-web/src/pages/contacto/index.astro` — Ajustes visuales
- `apps/nexus-corp-web/src/components/Header.astro` — Ajustes visuales
- `apps/nexus-corp-web/src/pages/webinar/index.astro` → `manual/index.astro` — Renombrado
- `apps/api/drizzle/0003_purple_mephisto.sql` — Nueva migración

**Flujo de integración:**

```
QuoteWizard (React component)
    │
    ▼
sendQuoteWithLead(payload)
    │
    ▼
POST /api/quotes-with-lead  (Next.js/Astro API Route)
    │
    ▼
POST /api/quotes/with-lead  (Hono backend)
    │
    ├── sanitizeCreateQuoteWithLeadRequest()
    ├── quotesService.createQuoteWithLead()
    │   ├── Busca lead por teléfono (phone_leads)
    │   ├── Si existe → usa ese lead_id
    │   ├── Si no existe → crea nuevo lead (source="quote", status="new")
    │   └── Crea cotización anclada al lead
    └── Devuelve { lead_id, isNewLead, quote }
```

---

### 3.5. `mateo/dev/services-for-admin` (1 commit)

**Objetivo:** Preparar el backend para el panel de administración extendiendo el schema y documentando la API.

| Commit | Descripción |
|---|---|
| `fcb0a67` | Modificación DB, Contrato de Uso API |

**Cambios en DB:**
- `apps/api/src/database/schemas/leads.ts` — Agregados campos:
  - `accepted_terms_lead: boolean`
  - `accepted_terms_at: timestamp`
  - `accepted_terms_ip: varchar(45)`
- Estos campos permiten trazabilidad legal de la aceptación de términos y condiciones

**Service layer introducida:**
- `apps/api/src/services/leads_services.ts` — **NUEVO**
  - `getAllLeadsWithQuotes()` — Hace `leftJoin` entre `leads` y `quotes`, agrupa por lead_id
- `apps/api/src/services/quotes_services.ts` — Actualizado con lógica de `createQuoteWithLead`

**Documentación creada:**
- `docs/contrato-leads-quotes.md` — **Contrato profesional de API** para el dashboard de administración
  - 7 endpoints documentados con request/response examples
  - Tipos de datos y validaciones
  - Notas de implementación (decimales como strings, enums cerrados)

**Utilidad nueva:**
- `apps/api/src/utils/request.ts` — Helper para obtener IP del cliente (`getClientIp`)

---

### 3.6. `mateo/dev/pruebas-ok` (1 commit)

**Objetivo:** Wirear `acceptTerms` a través de todos los endpoints web y pasar pruebas.

| Commit | Descripción |
|---|---|
| `405d657` | Base de datos almacena acceptTerms y pruebas pasadas en next |

**Archivos modificados:**
- `apps/api/drizzle/0004_deep_thunderbolt_ross.sql` — Migración para campos acceptTerms
- `apps/api/src/controller/control_lead.ts` — Actualizado para manejar acceptTerms
- `apps/nexus-corp-web/src/pages/api/contact.ts` — Wireado acceptTerms
- `apps/nexus-corp-web/src/pages/api/quotes-with-lead.ts` — Wireado acceptTerms
- `apps/nexus-corp-web/src/pages/api/webinar-registration.ts` — Wireado acceptTerms

**Flujo de acceptTerms:**
1. Usuario marca checkbox en QuoteWizard ("Acepto los términos y condiciones")
2. Frontend envía `acceptedTerms: true` + IP del cliente
3. Backend almacena: `accepted_terms_lead = true`, `accepted_terms_at = NOW()`, `accepted_terms_ip = clientIP`
4. Admin puede ver esta trazabilidad en el dashboard

---

### 3.7. `mateo/dev/azureStorage` (1 commit)

**Objetivo:** Integrar Azure Blob Storage para subida de archivos y construir el módulo de Credit Scores.

| Commit | Descripción |
|---|---|
| `3e60543` | Se genera servicio Storage para adm y web |

**Archivos creados:**

**Módulo Credit Scores (completo):**
- `apps/api/src/controller/control_credit_scores.ts` — 182 líneas
  - Endpoints: `GET /`, `GET /:id`, `POST /`, `PUT /:id/status`, `POST /:id/upload-contract`, `POST /:id/upload-selfie`
- `apps/api/src/database/schemas/credit_scores.ts` — Schema Drizzle
  - Campos: id, lead_id (FK), status (enum: PENDING/UNDER_REVIEW/APPROVED/REJECTED/CANCELLED), contract_url, selfie_url, reviewed_by_magic_link, notes, created_at, updated_at
- `apps/api/src/dto/credit_scores.dto.ts` — DTOs con Zod
- `apps/api/src/repositories/credit_scores_repositories.ts` — Capa de repositorio
- `apps/api/src/services/credit_scores_services.ts` — Lógica de negocio

**Servicio Azure:**
- `apps/api/src/services/azure/azure_services.ts` — **Azure Blob Storage client**
  - Inicialización lazy del `BlobServiceClient`
  - Subida de archivos con streams
  - Generación de SAS URLs (Shared Access Signature) para acceso temporal seguro

**Documentación:**
- `docs/servicioAzureStorage.md` — Guía completa del servicio Azure + API Credit Scores

**Dependencia agregada:**
- `@azure/storage-blob` en `apps/api/package.json`

**Archivos modificados:**
- `apps/api/src/database/schemas/index.ts` — Export de credit_scores
- `apps/api/src/database/schemas/leads.ts` — Referencia a credit_scores
- `apps/api/src/routes/routes_controller.ts` — Montado `/credit-scores`
- `package-lock.json`

---

## 4. Patrones y Arquitectura Identificados

### 4.1. Arquitectura en Capas (Layered Architecture)

Mateo introdujo una separación clara de responsabilidades:

```
HTTP Layer       → controllers/
Validation Layer → dto/ (sanitizers + types)
Business Layer   → services/
Data Layer       → repositories/ (en credit_scores) + utils/crud.ts
Cross-cutting    → middleware/
```

### 4.2. Patrón de Sanitización Manual

En vez de usar Zod para runtime validation, Mateo implementó sanitizadores manuales:

```typescript
// dto/lead_notesDTO.ts
function sanitizeLeadNoteCreate(body: unknown): LeadNoteCreateDto | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const manager_lead_notes = typeof payload.manager_lead_notes === "string" 
    ? payload.manager_lead_notes.trim() : "";
  const id_leads = typeof payload.id_leads === "number" 
    ? payload.id_leads : undefined;
  if (!manager_lead_notes || id_leads === undefined) return null;
  return { manager_lead_notes, note_lead_notes, id_leads };
}
```

**Pros:** Ligero, sin dependencia de librería de validación.  
**Cons:** Repetitivo, no genera tipos automáticos, propenso a inconsistencias entre DTOs.

### 4.3. CRUD Genérico

`utils/crud.ts` proporciona funciones reutilizables:
- `getAll<T>(table)`
- `getById<T>(table, column, id)`
- `getByField<T>(table, column, value)`
- `createOne<T>(table, data)`
- `updateById<T>(table, column, id, data)`
- `deleteById(table, column, id)`
- `listWithFilters<T>(table, filters)`

Esto reduce drásticamente el boilerplate en los controladores.

### 4.4. Seguridad por API Key

```typescript
// middleware/api_key_middleware.ts
const VALID_API_KEY = process.env.VALID_API_KEY;
if (!apiKey || apiKey !== VALID_API_KEY) {
  return c.json({ error: "Unauthorized", message: "API Key inválida..." }, 401);
}
```

Todas las rutas bajo `/api/*` (excepto auth) requieren header `x-api-key`.

### 4.5. Trazabilidad Completa del Lead

Mateo diseñó el schema de leads con campos de auditoría legal:
- `source_leads` — Origen (web/manual/quote/chatbot)
- `accepted_terms_lead` — Boolean de aceptación
- `accepted_terms_at` — Timestamp exacto
- `accepted_terms_ip` — IP del solicitante
- `createdAt` / `updatedAt` — Timestamps automáticos

Esto permite al administrador demostrar compliance legal si es necesario.

### 4.6. Lead + Quote Atomic Creation

El endpoint `POST /quotes/with-lead` implementa una transacción lógica:

```
1. Sanitizar payload
2. Buscar lead existente por teléfono (phone_leads unique)
3. Si existe → reutilizar lead_id
4. Si no existe → crear lead nuevo (source="quote", status="new")
5. Crear cotización con lead_id
6. Devolver { lead_id, isNewLead, quote }
```

Esto evita duplicados de leads y ancla automáticamente la cotización.

---

## 5. Métricas de Contribución

| Métrica | Valor |
|---|---|
| Ramas creadas | 8 |
| Commits productivos | 12 |
| Controladores creados | 7 |
| DTOs creados | 7 |
| Schemas de DB | 6 (incluyendo credit_scores) |
| Servicios creados | 4 |
| Middleware creados | 2 |
| Migraciones Drizzle | 5 (0000 → 0004) |
| Documentos técnicos | 3 |
| Archivos totales afectados | ~80+ |

---

## 6. Documentación Creada por Mateo

| Documento | Ubicación | Contenido |
|---|---|---|
| Informe de actividades Docker | `Informe-actividades-1-7-2026.md` | Setup inicial de Docker, Hono, estructura de carpetas |
| Contrato API Leads/Quotes | `docs/contrato-leads-quotes.md` | 7 endpoints documentados para integración del admin panel |
| Servicio Azure Storage | `docs/servicioAzureStorage.md` | Guía del servicio Azure Blob + API Credit Scores |

---

## 7. Bugs y Deuda Técnica Identificada

### 7.1. IDs tipados como string en el frontend

El backend devuelve `id_leads: number` (PostgreSQL serial), pero el contrato de Mateo no especificaba explícitamente el tipo de ID. Cuando Steven implementó el frontend, asumió `string` inicialmente, lo cual rompió `POST /notes`.

**Fix aplicado por Steven:** Cambiar todos los IDs de `string` → `number` en `src/lib/types.ts`.

### 7.2. `getAllLeadsWithQuotes` no usa paginación

El endpoint `GET /leads/with-quotes` devuelve **todos** los leads con **todas** sus cotizaciones. Para volúmenes >500 registros, esto será un problema de performance.

**Recomendación futura:** Agregar query params `?page` y `?limit` al backend.

### 7.3. Azure Storage sin manejo de errores de conexión

`azure_services.ts` inicializaba el `BlobServiceClient` de forma eager, causando crash del backend si `AZURE_STORAGE_CONNECTION_STRING` estaba ausente.

**Fix aplicado por Steven:** Conversión a inicialización lazy (solo se conecta cuando se usa).

### 7.4. DTOs manuales vs Zod

Mateo implementó sanitizadores manuales en vez de usar Zod. Esto funciona pero es más propenso a inconsistencias y no genera tipos TypeScript automáticamente.

**Recomendación futura:** Migrar a Zod schemas con inferencia de tipos.

---

## 8. Dependencias Introducidas

| Paquete | Versión | Propósito |
|---|---|---|
| `hono` | ^4.x | Framework web API |
| `@hono/node-server` | — | Adapter Node.js para Hono |
| `drizzle-orm` | ^0.39 | ORM PostgreSQL |
| `drizzle-kit` | — | CLI para migraciones |
| `pg` | — | Driver PostgreSQL para Node |
| `@azure/storage-blob` | ^12.x | Azure Blob Storage client |
| `jsonwebtoken` | — | JWT signing/verification |
| `dotenv` | — | Variables de entorno |

---

## 9. Estado de Merge

Todas las ramas de Mateo están **completamente mergeadas** a `master`:

| Branch | Merge Commit en master | Estado |
|---|---|---|
| `mateo/dev/docker-integracion` | `56bec50` (PR #4) | ✅ Mergeado |
| `mateo/dev/services-database` | Incluido en PR #5 | ✅ Mergeado |
| `mateo/dev/services-api` | `3120f3a` (PR #5) | ✅ Mergeado |
| `mateo/dev/integration-web-api` | Incluido en PR #8 | ✅ Mergeado |
| `mateo/dev/services-for-admin` | Incluido en PR #8 | ✅ Mergeado |
| `mateo/dev/pruebas-ok` | `acfd110` (PR #8) | ✅ Mergeado |
| `mateo/dev/azureStorage` | `94abf37` | ✅ Mergeado |

---

## 10. Archivos Relacionados

- **Backend API:** `apps/api/src/controller/`, `apps/api/src/services/`, `apps/api/src/dto/`
- **Database:** `apps/api/src/database/schemas/`, `apps/api/drizzle/`
- **Middleware:** `apps/api/src/middleware/`
- **Utilidades:** `apps/api/src/utils/`
- **Contrato API:** `docs/contrato-leads-quotes.md`
- **Azure Storage:** `docs/servicioAzureStorage.md`
- **Seed de prueba:** `apps/api/src/scripts/seed-leads-and-quotes.ts` (creado por Steven para testing)

---

*Informe generado tras análisis exhaustivo de las 8 ramas de Mateo y su contribución al monorepo NEXUS Corp.*
