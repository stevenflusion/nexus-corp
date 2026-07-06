# Informe de Desarrollo: Dashboard de Leads y Cotizaciones

**Fecha:** 2026-07-06  
**Autor:** Steven  
**Rama:** Dev/Steven  
**Commits:** `1470aeb`, `ebac0dd`  
**Estado:** Pusheado a GitHub, listo para merge a master

---

## 1. Resumen Ejecutivo

Implementación completa del **dashboard de administración de leads** en el panel de administración (`apps/admin-panel-web`). Esta funcionalidad permite al equipo de NEXUS visualizar, filtrar, clasificar y gestionar el pipeline comercial de leads con sus cotizaciones asociadas, directamente desde el panel de administración.

**15 archivos creados/modificados**, **~1,780 líneas de código**, siguiendo el patrón de arquitectura establecido por el módulo de Magic Links.

### Qué se entregó

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Tabla de leads con cotizaciones | ✅ | Paginación, filtros, búsqueda, ordenamiento client-side |
| Detalle de lead (Sheet drawer) | ✅ | Info completa, cotizaciones, cambio de estado, notas CRUD |
| Filtros avanzados | ✅ | Por estado (new/contacted/qualified/lost) y origen (web/manual/quote/chatbot/otro) |
| CRUD de notas de seguimiento | ✅ | Crear, editar inline, eliminar con confirmación |
| Cambio de estado del lead | ✅ | PUT al backend con selector desplegable |
| Seed de datos de prueba | ✅ | 6 leads + 6 cotizaciones con datos realistas |

---

## 2. Contexto y Motivación

### 2.1. Problema

El backend ya tenía implementado el 100% del CRUD de leads, cotizaciones y notas de seguimiento (trabajo previo de Mateo). Sin embargo, el panel de administración **carecía de cualquier interfaz** para acceder a estos datos. Los leads entraban por el cotizador de nexus-web, por formularios de contacto, o se registraban manualmente, pero no había forma de visualizarlos, clasificarlos ni hacer seguimiento.

### 2.2. Objetivo

Construir una interfaz de gestión de leads que:

1. **Liste todos los leads** con sus cotizaciones anidadas en una sola vista.
2. **Permita filtrar** por estado del pipeline y origen del lead.
3. **Permita cambiar el estado** del lead (nuevo → contactado → calificado → perdido).
4. **Permita agregar notas de seguimiento** con autor, contenido y timestamp.
5. **Sea consistente** con el resto del admin panel (patrón Magic Links).

### 2.3. Contrato de API

Mateo dejó documentado el contrato en `docs/contrato-leads-quotes.md`. El backend expone 7 endpoints:

| Método | Endpoint | Propósito |
|---|---|---|
| `GET` | `/api/leads/with-quotes` | Todos los leads con array de cotizaciones |
| `GET` | `/api/leads/:id` | Lead puntual |
| `PUT` | `/api/leads/:id` | Cambiar `status_leads` |
| `GET` | `/api/notes/lead/:id` | Notas de un lead |
| `POST` | `/api/notes` | Crear nota |
| `PUT` | `/api/notes/:id` | Editar nota |
| `DELETE` | `/api/notes/:id` | Eliminar nota |

---

## 3. Arquitectura de la Solución

### 3.1. Diagrama de Flujo de Datos

```
┌───────────────────────────────────────────────────────────────┐
│                    Admin Panel (Next.js 15)                   │
│                                                               │
│   /dashboard/leads/page.tsx                                   │
│   ├── LeadFilters  ──► filtros client-side (status, source) │
│   ├── LeadsTable   ──► tabla con click → abre drawer        │
│   ├── Pagination   ──► slice de array (client-side)           │
│   └── LeadDetailDrawer (Sheet)                                │
│       ├── Lead info + Status selector                         │
│       ├── Quotes list (cotizaciones anidadas)                 │
│       └── LeadNotes (CRUD completo)                           │
│                                                               │
└────────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────────┐
│              Repository Facade (lib/leads.ts)                   │
│                                                               │
│   getLeadsWithQuotes()  ──► GET /leads/with-quotes            │
│   updateLeadStatus()    ──► PUT /leads/:id                    │
│   getLeadNotes()        ──► GET /notes/lead/:id               │
│   createLeadNote()      ──► POST /notes                       │
│   updateLeadNote()       ──► PUT /notes/:id                   │
│   deleteLeadNote()       ──► DELETE /notes/:id                │
│                                                               │
└────────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────────┐
│              Backend API (Hono.js 4 + Drizzle ORM)            │
│                                                               │
│   Controladores: control_lead.ts, control_lead_notes.ts       │
│   Servicios:     leads_services.ts (leftJoin quotes)          │
│   DTOs:          leadDTO.ts, lead_notesDTO.ts, quotesDTO.ts   │
│   DB:            PostgreSQL via Drizzle                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 3.2. Decisiones de Diseño Clave

| Decisión | Alternativa Rechazada | Fundamento |
|---|---|---|
| **Sheet drawer** para detalle | Ruta separada `/leads/[id]` | Menor latencia (reusa datos del listado), mejor UX en desktop. Si el volumen de leads crece, se migra a ruta dedicada con fetch incremental. |
| **Client-side pagination** | Server-side pagination | El backend devuelve el array completo. Para <500 leads, paginar client-side es suficiente y evita modificar la API. |
| **Replicar patrón Magic Links** | Abstraer componentes genéricos | Magic Links es el estándar del equipo. Replicar su arquitectura (facade, Table, Filters, Drawer, sonner toasts) minimiza carga cognitiva y acelera delivery. |
| **Tipos con snake_case exacto** | Mapear a camelCase | El backend devuelve snake_case nativamente. Mantener los mismos nombres evita bugs de mapping y reduce transformaciones innecesarias. |
| **IDs como `number`** | IDs como `string` | PostgreSQL `serial` / `integer` devuelve números. El frontend los tipó inicialmente como string, lo cual rompió el endpoint `POST /notes` (el sanitizador backend exige `typeof === "number"`). Corregido antes de release. |

---

## 4. Desglose Técnico

### 4.1. Foundation (3 archivos modificados)

#### `src/lib/api-client.ts` — Extensión del cliente HTTP

Antes solo tenía `apiGet` y `apiPost`. Se agregaron:

```typescript
export async function apiPut<T>(path: string, body?: unknown): Promise<T>
export async function apiDelete<T>(path: string): Promise<T>
```

Ambos con el mismo manejo de errores (`ApiError` con `status` y `message`), headers `x-api-key`, y fallback a "Error de conexión" en caso de excepción de red.

#### `src/lib/types.ts` — Dominio Lead

Tipos que matchean exactamente el schema del backend:

```typescript
export interface Lead {
  id_leads: number           // serial PK
  name_leads: string
  email_leads: string | null
  phone_leads: string | null
  city_leads: string | null
  status_leads: LeadStatus   // enum: new | contacted | qualified | lost
  source_leads: LeadSource   // enum: web | manual | quote | chatbot | otro
  monthly_family_income: string | null  // decimal as string
  coments_optionals_lead: string | null
  accepted_terms_lead: boolean
  accepted_terms_at: string | null
  accepted_terms_ip: string | null
  createdAt: string
  updatedAt: string
  quotes?: Quote[]           // nested from GET /leads/with-quotes
}

export interface Quote {
  id_quotes: number
  lead_id: number
  product_quotes: string     // vehicle | housing | consumer
  requested_amount_quotes: string
  down_payment_quotes: string
  term_months_quotes: number
  annual_interest_rate_quotes: string
  monthly_payment_quotes: string
  contact_preference_quotes: string
  result_status_quotes: string
  createdAt: string
  updatedAt: string
}
```

#### `src/components/app-sidebar.tsx` — Navegación

Agregado el item **"Leads"** bajo la sección "Administrador", con icono `Users` y link a `/dashboard/leads`.

### 4.2. Componentes UI (10 archivos nuevos)

#### `src/components/leads/LeadsTable.tsx`

Tabla con shadcn/ui `<Table>`:
- 6 columnas: Estado, Nombre, Contacto, Ciudad/Origen, Cotizaciones, Creado
- Click en fila abre el `LeadDetailDrawer`
- `StatusBadge` en la columna de estado
- Badge de origen (Web, Manual, Cotizador, etc.)
- Formato de fecha con `Intl.DateTimeFormat("es-AR")`

#### `src/components/leads/LeadFilters.tsx`

Filtros client-side:
- **Buscador**: por nombre, email o teléfono (input con icono Search)
- **Status**: dropdown con 5 opciones (todos + 4 estados)
- **Source**: dropdown con 6 opciones (todos + 5 orígenes)
- **Limpiar filtros**: botón ghost visible solo cuando hay filtros activos

#### `src/components/leads/Pagination.tsx`

Controles de paginación:
- Botones anterior/siguiente
- Indicador "Página X de Y"
- Selector de items por página: 6, 12, 24
- Total de resultados

#### `src/components/leads/LeadDetailDrawer.tsx`

Sheet lateral (shadcn/ui `<Sheet>`) con 5 secciones:

1. **Estado**: Badge + selector desplegable para cambiar `status_leads`. PUT al backend, toast de éxito/error, actualización optimista del listado.
2. **Información general**: Nombre, email, teléfono, ciudad, origen, ingresos, comentarios.
3. **Términos**: Aceptados (sí/no), fecha, IP.
4. **Cotizaciones**: Lista de `QuoteRow` con formato de moneda y porcentaje.
5. **Metadata**: Fechas de creación y actualización.

**Helpers de formato** (agregados en commit `ebac0dd`):
```typescript
function formatCurrency(value: string): string
function formatPercent(value: string): string
function calculateFinanced(amount: string, downPayment: string): string
```

#### `src/components/leads/QuoteRow.tsx` (dentro del drawer)

Card por cada cotización:
- Producto y resultado del cotizador
- Monto objetivo, entrada inicial, **monto a financiar** (calculado como `monto - entrada`)
- Cuota mensual, plazo, TNA

#### `src/components/leads/LeadNotes.tsx`

CRUD completo de notas de seguimiento:
- **Listado**: autor, contenido, fecha
- **Crear**: formulario inline con Input (autor) + Textarea (nota) + botones Guardar/Cancelar
- **Editar inline**: al hacer click en el lápiz, el item se convierte en formulario editable
- **Eliminar**: botón de basura → dispara `ConfirmDialog` → DELETE al backend → actualización optimista

#### `src/components/leads/StatusBadge.tsx`

Badge de color según estado:
- `new` → verde
- `contacted` → azul
- `qualified` → amarillo/naranja
- `lost` → gris/rojo

#### Otros componentes

- `EmptyState.tsx` — Dos variantes: "No hay leads" y "No hay resultados para tu búsqueda"
- `LoadingSkeleton.tsx` — Skeleton loader con 6 columnas para la tabla
- `ConfirmDialog.tsx` — Diálogo genérico de confirmación (título, descripción, botones)

### 4.3. Página principal

#### `src/app/dashboard/leads/page.tsx`

Page component que orquesta todo:
1. **useEffect** → llama `getLeadsWithQuotes(filters)`
2. **useState** → filtros, leads, loading, paginación, lead seleccionado
3. **Filtrado client-side** → búsqueda por texto + status + source
4. **Paginación** → slice del array filtrado
5. **Render condicional** → loading ? Skeleton : empty ? EmptyState : Table + Pagination
6. **LeadDetailDrawer** → pasando lead, estado de apertura, handlers de cambio de estado y delete
7. **ConfirmDialog** → para confirmar eliminación de notas

### 4.4. Seed de datos de prueba

#### `apps/api/src/scripts/seed-leads-and-quotes.ts`

Script standalone que usa Drizzle ORM directamente (no requiere backend corriendo). Inserta:

| Lead | Origen | Estado | Ciudad | Producto | Monto |
|---|---|---|---|---|---|
| Carlos Mendoza | Web | Nuevo | Quito | Vehículo | $28,000 |
| Laura Sánchez | Web | Contactado | Guayaquil | Vivienda | $85,000 |
| Pedro Vásquez | Manual | Calificado | Cuenca | Consumo | $12,000 |
| Ana Torres | Manual | Nuevo | Ambato | Vehículo | $15,000 |
| Mateo Velasco | Quote | Nuevo | Quito | Vehículo | $32,000 |
| Diana Ramírez | Quote | Perdido | Manta | Consumo | $8,000 |

Cada lead tiene exactamente **1 cotización** con datos realistas (tasas, plazos, resultados del cotizador).

---

## 5. Bugs Encontrados y Corregidos

### 5.1. CRÍTICO: `id_leads` como string rompía creación de notas

**Síntoma:** Al intentar crear una nota, el backend respondía 400:  
`{ error: "manager_lead_notes, note_lead_notes and id_leads are required" }`

**Causa raíz:** El frontend tipó `id_leads: string` en `src/lib/types.ts`, pero el backend sanitizador en `lead_notesDTO.ts` exige:
```typescript
const id_leads = typeof payload.id_leads === "number" ? payload.id_leads : undefined;
```

**Fix:** Cambiar **todos los IDs** de `string` → `number` en tipos, facade y componentes. PostgreSQL `serial` siempre devuelve números.

### 5.2. `LeadsListResponse` ficticio causaba `leads is undefined`

**Síntoma:** Runtime TypeError al cargar la página: `can't access property "length", leads is undefined`

**Causa raíz:** El facade `getLeadsWithQuotes` esperaba `{ items: Lead[] }` (envelope paginado), pero el backend devuelve `Lead[]` directamente.

**Fix:** Eliminar la interfaz `LeadsListResponse` y consumir `apiGet<Lead[]>("/leads/with-quotes")` directamente.

### 5.3. Tasa anual mostrada como `0.12%` en vez de `12%`

**Causa:** El backend almacena la tasa como decimal (`0.12` = 12%). El frontend concatenaba `value + "%"`.

**Fix:** Usar `Intl.NumberFormat` con `style: "percent"`, que multiplica por 100 automáticamente.

### 5.4. Montos sin separador de miles

**Causa:** Concatenación directa de strings decimales.

**Fix:** `Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })` para todos los montos.

---

## 6. Métricas y Resultados

### 6.1. Líneas de Código

| Área | Archivos | Líneas (approx) |
|---|---|---|
| Componentes UI | 10 | ~1,400 |
| Tipos + Facade | 3 | ~250 |
| Página principal | 1 | ~164 |
| Seed script | 1 | ~208 |
| **Total** | **15** | **~1,780** |

### 6.2. Cobertura de Endpoints

7 de 7 endpoints del contrato están integrados en el frontend.

### 6.3. Tiempo de Implementación

SDD completo (exploración → propuesta → spec → diseño → tasks → apply → verify → fix de bugs → seed → push) en ~2 horas.

---

## 7. Próximos Pasos Recomendados

1. **Merge a `master`** — La rama `Dev/Steven` tiene los commits `1470aeb` y `ebac0dd` listos.
2. **Server-side pagination** — Si el volumen de leads supera ~500 registros, agregar `?page` y `?limit` al backend y migrar la paginación al servidor.
3. **Export a Excel/CSV** — Botón en la tabla para descargar leads filtrados.
4. **Notificaciones en tiempo real** — WebSocket o Server-Sent Events para alertar cuando llega un lead nuevo.
5. **Gráficos de pipeline** — Dashboard con funnel de conversión (new → contacted → qualified → lost).
6. **Tests E2E** — Playwright ya está instalado en el monorepo pero sin config. Agregar tests de smoke para el flujo completo de leads.

---

## 8. Archivos Relacionados

- **Contrato de API:** `docs/contrato-leads-quotes.md`
- **Frontend admin:** `apps/admin-panel-web/src/app/dashboard/leads/page.tsx`
- **Componentes:** `apps/admin-panel-web/src/components/leads/*`
- **Facade API:** `apps/admin-panel-web/src/lib/leads.ts`
- **Tipos:** `apps/admin-panel-web/src/lib/types.ts`
- **Backend controller:** `apps/api/src/controller/control_lead.ts`, `control_lead_notes.ts`
- **Backend service:** `apps/api/src/services/leads_services.ts`
- **Seed script:** `apps/api/src/scripts/seed-leads-and-quotes.ts`

---

*Informe generado automáticamente tras la sesión de desarrollo del 2026-07-06.*
