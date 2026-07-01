import { createHmac, timingSafeEqual } from "node:crypto"

import { getSiteUrl, getWhatsAppApiConfig } from "./config"

const MAX_JSON_BODY_BYTES = 32 * 1024

export const getContentLength = (request: Request) => {
  const contentLength = request.headers.get("content-length")

  if (!contentLength) {
    return 0
  }

  const parsedLength = Number(contentLength)
  return Number.isFinite(parsedLength) ? parsedLength : Number.POSITIVE_INFINITY
}

export const isJsonRequest = (request: Request) => {
  const contentType = request.headers.get("content-type") ?? ""
  return contentType.toLowerCase().includes("application/json")
}

export const isBodyTooLarge = (request: Request) =>
  getContentLength(request) > MAX_JSON_BODY_BYTES

export const isRawBodyTooLarge = (body: string) =>
  new TextEncoder().encode(body).byteLength > MAX_JSON_BODY_BYTES

const normalizeOrigin = (value: string) => {
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return ""
  }
}

const getLocalDevOrigins = (requestUrl: string) => {
  try {
    const url = new URL(requestUrl)

    if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      return []
    }

    const port = url.port ? `:${url.port}` : ""
    return [`http://localhost${port}`, `http://127.0.0.1${port}`]
  } catch {
    return []
  }
}

export const isAllowedOrigin = (request: Request) => {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  const config = getWhatsAppApiConfig()
  const requestOrigin = normalizeOrigin(request.url)
  const configuredOrigins = config.allowedOrigins
    .split(",")
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean)

  const siteOrigin = normalizeOrigin(getSiteUrl())
  const allowedOrigins = new Set([
    ...(requestOrigin ? [requestOrigin] : []),
    ...getLocalDevOrigins(request.url),
    ...configuredOrigins,
    ...(siteOrigin ? [siteOrigin] : []),
  ])

  return allowedOrigins.has(normalizeOrigin(origin))
}

export const verifyWhatsAppSignature = (request: Request, rawBody: string) => {
  const { appSecret } = getWhatsAppApiConfig()

  if (!appSecret) {
    return {
      configured: false,
      valid: false,
    }
  }

  const signature = request.headers.get("x-hub-signature-256") ?? ""

  if (!signature.startsWith("sha256=")) {
    return {
      configured: true,
      valid: false,
    }
  }

  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")
  const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`, "utf8")
  const receivedBuffer = Buffer.from(signature, "utf8")

  return {
    configured: true,
    valid:
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer),
  }
}
