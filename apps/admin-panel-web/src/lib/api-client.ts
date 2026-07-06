// Thin, dependency-free fetch wrapper for the Nexus admin panel API.
// Reads base URL and API key from NEXT_PUBLIC_ env vars so they are available
// in the Next.js client bundle.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function ensureConfig(): void {
  if (!API_BASE) {
    throw new ApiError(0, "Configuración incompleta: falta NEXT_PUBLIC_API_URL")
  }
  if (!API_KEY) {
    throw new ApiError(0, "Configuración incompleta: falta NEXT_PUBLIC_API_KEY")
  }
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  const url = new URL(normalizedPath, base)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value)
      }
    })
  }

  return url.toString()
}

async function parseError(response: Response): Promise<ApiError> {
  const status = response.status
  let message = ""

  try {
    const body = await response.json()
    message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : JSON.stringify(body)
  } catch {
    message = await response.text()
  }

  if (status === 404) {
    message = "No encontrado"
  } else if (status === 409) {
    message = "Conflicto"
  } else if (status === 422) {
    if (!message || message === "{}") message = "Error de validación"
  }

  return new ApiError(status, message || "Error en la solicitud")
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  ensureConfig()

  try {
    const response = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
      },
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, "Error de conexión")
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  ensureConfig()

  try {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, "Error de conexión")
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  ensureConfig()

  try {
    const response = await fetch(buildUrl(path), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, "Error de conexión")
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  ensureConfig()

  try {
    const response = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
      },
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, "Error de conexión")
  }
}
