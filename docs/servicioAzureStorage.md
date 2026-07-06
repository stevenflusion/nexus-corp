# Credit Scores API

## Base URL

```
/api/credit-scores
```

---

# 1. Crear una solicitud de Score Crediticio

Crea una nueva solicitud de consulta de score crediticio asociada a un Lead existente.

## Endpoint

```
POST /api/credit-scores
```

## Content-Type

```
multipart/form-data
```

## Parámetros

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| id_leads | number | Sí | Identificador del Lead |
| contract | File | Sí | Contrato firmado por el cliente |
| selfie | File | Sí | Fotografía del cliente sosteniendo su cédula |

## Ejemplo

Body → form-data

| Key | Type |
|-----|------|
| id_leads | Text |
| contract | File |
| selfie | File |

### Respuesta

```json
{
    "id_credit_scores": 1,
    "id_leads": 15,
    "storage_path_contract": "contracts/xxxxx.pdf",
    "storage_path_selfie": "selfies/xxxxx.jpg",
    "status_credit_scores": "PENDING",
    "result_credit_scores": null,
    "observations_credit_scores": null
}
```

---

# 2. Listar todas las solicitudes

Obtiene todas las solicitudes de score crediticio junto con la información del Lead.

## Endpoint

```
GET /api/credit-scores
```

## Respuesta

```json
[
    {
        "id_credit_scores": 1,
        "name_leads": "Mateo Velasco",
        "phone_leads": "0999999999",
        "email_leads": "mateo@gmail.com",
        "storage_path_contract": "contracts/xxxxx.pdf",
        "storage_path_selfie": "selfies/xxxxx.jpg",
        "status_credit_scores": "PENDING",
        "observations_credit_scores": null,
        "result_credit_scores": null,
        "create_at": "2026-07-06T20:30:00.000Z"
    }
]
```

---

# 3. Obtener una solicitud

Obtiene toda la información de una solicitud específica.

## Endpoint

```
GET /api/credit-scores/:id
```

## Parámetros

| Parámetro | Tipo |
|-----------|------|
| id | number |

## Respuesta

```json
{
    "id_credit_scores": 1,
    "name_leads": "Mateo Velasco",
    "phone_leads": "0999999999",
    "email_leads": "mateo@gmail.com",
    "storage_path_contract": "contracts/xxxxx.pdf",
    "storage_path_selfie": "selfies/xxxxx.jpg",
    "status_credit_scores": "PENDING",
    "observations_credit_scores": null,
    "result_credit_scores": null,
    "create_at": "2026-07-06T20:30:00.000Z",
    "update_at": "2026-07-06T20:30:00.000Z"
}
```

---

# 4. Actualizar una solicitud

Permite al asesor actualizar el estado de la solicitud.

## Endpoint

```
PUT /api/credit-scores/:id
```

## Body

```json
{
    "status_credit_scores": "APPROVED",
    "result_credit_scores": 745,
    "observations_credit_scores": "Cliente aprobado.",
    "reviewed_by_magic_link": "uuid-del-magic-link"
}
```

## Respuesta

```json
{
    "message": "Credit Score updated successfully"
}
```

---

# 5. Obtener URL temporal del contrato

Genera una URL temporal (SAS URL) para visualizar o descargar el contrato firmado.

## Endpoint

```
GET /api/credit-scores/contract/:id
```

## Parámetros

| Parámetro | Tipo |
|-----------|------|
| id | number |

## Respuesta

```json
{
    "url": "https://storage.blob.core.windows.net/documents/contracts/xxxxx.pdf?...SAS..."
}
```

---

# 6. Obtener URL temporal de la selfie

Genera una URL temporal (SAS URL) para visualizar o descargar la fotografía del cliente.

## Endpoint

```
GET /api/credit-scores/selfie/:id
```

## Parámetros

| Parámetro | Tipo |
|-----------|------|
| id | number |

## Respuesta

```json
{
    "url": "https://storage.blob.core.windows.net/documents/selfies/xxxxx.jpg?...SAS..."
}
```

---

# Estados posibles

| Estado |
|----------|
| PENDING |
| UNDER_REVIEW |
| APPROVED |
| REJECTED |
| CANCELLED |

---

# Flujo del proceso

```text
Cliente
    │
    ▼
POST /credit-scores
    │
    ▼
Subida de contrato
Subida de selfie
    │
    ▼
Estado = PENDING
    │
    ▼
Administrador / Asesor
    │
    ▼
GET /credit-scores
    │
    ▼
Revisión
    │
    ▼
PUT /credit-scores/:id
    │
    ▼
APPROVED / REJECTED
    │
    ▼
Consulta de documentos
GET /:id/contract
GET /:id/selfie
```