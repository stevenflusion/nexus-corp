# Contrato de API — Dashboard de Leads y Cotizaciones

Este documento describe los endpoints disponibles en la API de NEXUS (Hono + Postgres) necesarios para construir el dashboard de administración de leads: ver leads con sus cotizaciones, crear notas de seguimiento, y modificar el estado de un lead.

Base URL (dentro de la red interna / según entorno):
```
http://localhost:4000/api
```

---

## 1. Autenticación

Todas las rutas bajo `/api/*` requieren el header:

```
x-api-key: <VALID_API_KEY>
```

Si falta o es inválido, la API responde:
```json
{ "error": "Unauthorized", "message": "API Key inválida o ausente en los encabezados (x-api-key)." }
```
con status `401`.

---

## 2. Ver leads con sus cotizaciones

**`GET /api/leads/with-quotes`**

Devuelve todos los leads junto con un array de sus cotizaciones asociadas (vacío si no tiene ninguna).

### Response `200 OK`
```json
[
  {
    "id_leads": 1,
    "name_leads": "Mateo Velasco",
    "email_leads": "mateo@example.com",
    "phone_leads": "0984603189",
    "city_leads": "Quito",
    "status_leads": "new",
    "source_leads": "quote",
    "monthly_family_income": "1800.00",
    "coments_optionals_lead": null,
    "accepted_terms_lead": true,
    "accepted_terms_at": "2026-07-04T10:15:00.000Z",
    "accepted_terms_ip": "190.12.34.56",
    "createdAt": "2026-07-04T10:15:00.000Z",
    "updatedAt": "2026-07-04T10:15:00.000Z",
    "quotes": [
      {
        "id_quotes": 5,
        "lead_id": 1,
        "product_quotes": "consumer",
        "requested_amount_quotes": "12000.00",
        "down_payment_quotes": "1500.00",
        "term_months_quotes": 36,
        "annual_interest_rate_quotes": "0.17",
        "monthly_payment_quotes": "373.15",
        "contact_preference_quotes": "phone",
        "result_status_quotes": "Escenario ajustado",
        "createdAt": "2026-07-04T10:15:01.000Z",
        "updatedAt": "2026-07-04T10:15:01.000Z"
      }
    ]
  }
]
```

**Notas:**
- Los leads sin cotizaciones aparecen igual, con `"quotes": []`.
- Los valores `decimal` de Postgres (montos, tasas) llegan como **strings**, no como números — hay que parsearlos en el front antes de hacer cálculos o formateo (`Number(valor)`).

---

## 3. Ver un lead puntual

**`GET /api/leads/:id`**

Devuelve un solo lead (sin sus cotizaciones — para eso usar el endpoint de arriba).

### Response `200 OK`
Mismo shape que un elemento de la lista de arriba, sin el campo `quotes`.

### Response `404 Not Found`
```json
{ "error": "Lead not found" }
```

---

## 4. Modificar el estado de un lead

**`PUT /api/leads/:id`**

### Request body
```json
{
  "status_leads": "contacted"
}
```

Valores válidos para `status_leads`:
```
"new" | "contacted" | "qualified" | "lost"
```

### Response `200 OK`
Devuelve el lead actualizado completo.

### Response `400 Bad Request`
```json
{ "error": "A valid 'status_leads' is required" }
```
(si falta el campo, o el valor no es uno de los 4 permitidos)

### Response `404 Not Found`
```json
{ "error": "Lead not found" }
```

> Este endpoint **solo actualiza `status_leads`** — cualquier otro campo en el body es ignorado por el sanitizador del backend.

---

## 5. Notas de seguimiento de un lead

> ⚠️ Requiere la autenticación adicional mencionada en la sección 1 — confirmar con backend antes de integrar.

### 5.1 Listar notas de un lead específico

**`GET /api/notes/lead/:id`**

`:id` es el `id_leads` del lead.

### Response `200 OK`
```json
[
  {
    "id_lead_notes": 3,
    "manager_lead_notes": "Ana (asesora)",
    "note_lead_notes": "Cliente pidió que lo llamemos después de las 6pm.",
    "id_leads": 1,
    "createdAt": "2026-07-04T14:00:00.000Z"
  }
]
```

### 5.2 Crear una nota

**`POST /api/notes`**

### Request body
```json
{
  "manager_lead_notes": "Ana (asesora)",
  "note_lead_notes": "Cliente pidió que lo llamemos después de las 6pm.",
  "id_leads": 1
}
```

Los 3 campos son obligatorios.

### Response `201 Created`
```json
{
  "manager_lead_notes": "Ana (asesora)",
  "note_lead_notes": "Cliente pidió que lo llamemos después de las 6pm.",
  "id_leads": 1
}
```

### Response `400 Bad Request`
```json
{ "error": "manager_lead_notes, note_lead_notes and id_leads are required" }
```

### 5.3 Editar una nota

**`PUT /api/notes/:id`**

`:id` es el `id_lead_notes`.

### Request body (cualquier subconjunto de estos campos)
```json
{
  "note_lead_notes": "Texto corregido de la nota."
}
```

### Response `200 OK`
Devuelve la nota actualizada.

### Response `404 Not Found`
```json
{ "error": "Lead note not found" }
```

### 5.4 Eliminar una nota

**`DELETE /api/notes/:id`**

### Response `200 OK`
```json
{ "success": true }
```

### Response `404 Not Found`
```json
{ "error": "Lead note not found" }
```

---

## 6. Resumen de endpoints para el dashboard

| Acción | Método | Ruta | Auth extra |
|---|---|---|---|
| Ver todos los leads con sus cotizaciones | GET | `/api/leads/with-quotes` | No |
| Ver un lead puntual | GET | `/api/leads/:id` | No |
| Cambiar estado de un lead | PUT | `/api/leads/:id` | No |
| Listar notas de un lead | GET | `/api/notes/lead/:id` | Sí (pendiente confirmar) |
| Crear nota | POST | `/api/notes` | Sí (pendiente confirmar) |
| Editar nota | PUT | `/api/notes/:id` | Sí (pendiente confirmar) |
| Eliminar nota | DELETE | `/api/notes/:id` | Sí (pendiente confirmar) |

---

## 7. Notas generales de implementación

- Todos los montos y tasas (`decimal` en Postgres) llegan como **string** en el JSON — convertir con `Number(...)` antes de operar o formatear.
- `status_leads` es un enum cerrado: `new | contacted | qualified | lost`. No hay endpoint para agregar valores nuevos al enum sin una migración de base de datos.
- El campo `source_leads` indica de dónde vino el lead: `web | manual | quote | chatbot | otro`.
- `accepted_terms_lead`, `accepted_terms_at`, `accepted_terms_ip` documentan la aceptación de términos y condiciones del lead — útil para mostrar en el detalle del lead por trazabilidad, pero no son editables desde el dashboard.