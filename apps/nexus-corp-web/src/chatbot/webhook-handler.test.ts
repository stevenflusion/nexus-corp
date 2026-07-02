import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test, { afterEach } from "node:test"
import { setTimeout as delay } from "node:timers/promises"

import { resetWhatsAppMessageDedupeForTests } from "./dedupe-service"
import {
  handleWhatsAppWebhookGet,
  handleWhatsAppWebhookPost,
} from "./webhook-handler"

const originalFetch = globalThis.fetch
const tempDirs: string[] = []

const envNames = [
  "META_VERIFY_TOKEN",
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_API_BASE_URL",
  "WHATSAPP_API_VERSION",
  "WHATSAPP_LEADS_FILE",
  "WHATSAPP_DEDUP_FILE",
]

const configureWhatsAppTestEnv = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "nexus-whatsapp-"))
  tempDirs.push(tempDir)

  process.env.META_VERIFY_TOKEN = "test-verify-token"
  process.env.META_APP_SECRET = "test-app-secret"
  process.env.META_ACCESS_TOKEN = "test-access-token"
  process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789"
  process.env.WHATSAPP_API_BASE_URL = "https://graph.example.test"
  process.env.WHATSAPP_API_VERSION = "v25.0"
  process.env.WHATSAPP_LEADS_FILE = join(tempDir, "whatsapp-leads.jsonl")
  process.env.WHATSAPP_DEDUP_FILE = join(
    tempDir,
    "whatsapp-message-ids.jsonl"
  )
  resetWhatsAppMessageDedupeForTests()
}

const signBody = (body: string, secret = process.env.META_APP_SECRET ?? "") =>
  createHmac("sha256", secret).update(body, "utf8").digest("hex")

const createSignedPostRequest = (payload: unknown, signature?: string) => {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload)

  return new Request("http://localhost:4321/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${signature ?? signBody(body)}`,
    },
    body,
  })
}

const createTextPayload = (id = "wamid.test.1", body = "hola") => ({
  entry: [
    {
      changes: [
        {
          value: {
            contacts: [
              {
                profile: {
                  name: "Cliente Prueba",
                },
                wa_id: "593981371278",
              },
            ],
            messages: [
              {
                from: "593981371278",
                id,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: "text",
                text: {
                  body,
                },
              },
            ],
          },
        },
      ],
    },
  ],
})

const mockFetch = (status = 200) => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []

  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init })
    return new Response("{}", { status })
  }) as typeof fetch

  return calls
}

const waitFor = async (predicate: () => boolean, timeoutMs = 500) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return
    }

    await delay(10)
  }

  assert.equal(predicate(), true)
}

afterEach(async () => {
  globalThis.fetch = originalFetch
  resetWhatsAppMessageDedupeForTests()

  for (const envName of envNames) {
    delete process.env[envName]
  }

  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
})

test("verifica correctamente el webhook de Meta", async () => {
  process.env.META_VERIFY_TOKEN = "test-verify-token"

  const okResponse = handleWhatsAppWebhookGet(
    new Request(
      "http://localhost:4321/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=abc123"
    )
  )
  const forbiddenResponse = handleWhatsAppWebhookGet(
    new Request(
      "http://localhost:4321/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123"
    )
  )

  assert.equal(okResponse.status, 200)
  assert.equal(await okResponse.text(), "abc123")
  assert.equal(forbiddenResponse.status, 403)
})

test("acepta POST con firma valida y evento sin mensajes", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch()

  const body = JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {},
          },
        ],
      },
    ],
  })

  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest(body)
  )

  await delay(20)

  assert.equal(response.status, 200)
  assert.equal(await response.text(), "EVENT_RECEIVED")
  assert.equal(calls.length, 0)
})

test("rechaza POST con firma invalida", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch()

  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest(createTextPayload("wamid.invalid"), "bad")
  )

  await delay(20)

  assert.equal(response.status, 403)
  assert.equal(calls.length, 0)
})

test("acepta statuses sin llamar al chatbot ni a Meta", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch()

  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: "wamid.status",
                    status: "delivered",
                  },
                ],
              },
            },
          ],
        },
      ],
    })
  )

  await delay(20)

  assert.equal(response.status, 200)
  assert.equal(await response.text(), "EVENT_RECEIVED")
  assert.equal(calls.length, 0)
})

test("mensaje de texto usa la logica central y envia respuesta por WhatsApp", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch()

  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest(createTextPayload("wamid.central", "hola"))
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), "EVENT_RECEIVED")

  await waitFor(() => calls.length === 1)

  const requestBody = JSON.parse(String(calls[0].init?.body))
  assert.equal(requestBody.to, "593981371278")
  assert.match(requestBody.text.body, /gracias por comunicarte con NEXUS/i)
})

test("mensaje duplicado no se procesa dos veces", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch()
  const payload = createTextPayload("wamid.duplicate", "hola")

  const firstResponse = await handleWhatsAppWebhookPost(
    createSignedPostRequest(payload)
  )
  const secondResponse = await handleWhatsAppWebhookPost(
    createSignedPostRequest(payload)
  )

  assert.equal(firstResponse.status, 200)
  assert.equal(secondResponse.status, 200)

  await waitFor(() => calls.length === 1)
  await delay(40)

  assert.equal(calls.length, 1)
})

test("error de Meta no tumba el webhook", async () => {
  await configureWhatsAppTestEnv()
  const calls = mockFetch(400)

  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest(createTextPayload("wamid.meta-error", "hola"))
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), "EVENT_RECEIVED")

  await waitFor(() => calls.length === 1)
})

test("mantiene el cuerpo JSON invalido controlado", async () => {
  await configureWhatsAppTestEnv()
  const invalidBody = "{"
  const response = await handleWhatsAppWebhookPost(
    createSignedPostRequest(invalidBody)
  )

  assert.equal(response.status, 400)
  assert.equal(await response.text(), "Invalid JSON")
})
